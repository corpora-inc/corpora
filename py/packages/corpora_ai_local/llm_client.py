import base64
import json
import re
from typing import TYPE_CHECKING, List, Type, TypeVar  # , get_origin

from corpora_ai.llm_interface import (
    ChatCompletionTextMessage,
    GeneratedImage,
    LLMBaseInterface,
)
from openai import OpenAI
from pydantic import BaseModel, ValidationError

if TYPE_CHECKING:
    from openai.types.images_response import ImagesResponse


T = TypeVar("T", bound=BaseModel)


def extract_last_arguments_json(text: str) -> str:
    og = text
    # Remove <think>...</think> and <tool_call>...</tool_call>
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    text = re.sub(r"<tool_call>.*?</tool_call>", "", text, flags=re.DOTALL)
    text = text.strip()

    decoder = json.JSONDecoder()
    idx = 0
    last_arguments = None
    last_json = None

    while idx < len(text):
        # Find next '{' or '['
        match = re.search(r"[\{\[]", text[idx:])
        if not match:
            break
        start = idx + match.start()
        try:
            obj, end = decoder.raw_decode(text[start:])
            if isinstance(obj, dict) and "arguments" in obj:
                last_arguments = obj["arguments"]
            last_json = obj
            idx = start + end
        except json.JSONDecodeError:
            idx = start + 1  # Move forward and try again

    if last_arguments is not None:
        return json.dumps(last_arguments, ensure_ascii=False)
    elif last_json is not None:
        return json.dumps(last_json, ensure_ascii=False)
    else:
        print(og)
        raise ValueError("No valid JSON found.")


# Usage example:
def get_tool_args(msg):
    # Try tool_calls first (if API ever returns it)
    tool_calls = getattr(msg, "tool_calls", None)
    if tool_calls:
        # your normal tool call logic here
        return tool_calls[0].function.arguments
    # Fallback: generic JSON extraction from message content
    return extract_last_arguments_json(msg.content)


class LocalClient(LLMBaseInterface):
    """
    Client for local OpenAI-compatible LLMs (e.g. LM Studio) running on the host machine.
    """

    def __init__(
        self,
        api_key: str = "foobar",  # LM Studio ignores the API key
        completion_model: str = "deepseek-r1-distill-qwen-7b",
        # embedding_model: str = "text-embedding-3-small",  # Optional / placeholder
        image_model: str = "sdxl-base",
        base_url: str = "http://host.docker.internal:1234/v1",
    ):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.completion_model = completion_model
        # self.embedding_model = embedding_model
        self.image_model = image_model

    def get_text_completion(
        self,
        messages: List[ChatCompletionTextMessage],
    ) -> str:
        if not messages:
            raise ValueError("Input messages must not be empty.")

        message_dicts = [
            {"role": msg.role, "content": msg.text} for msg in messages
        ]

        response = self.client.chat.completions.create(
            model=self.completion_model,
            messages=message_dicts,
        )
        return response.choices[0].message.content

    def get_data_completion(
        self,
        messages: List[ChatCompletionTextMessage],
        model: Type[T],
        retries: int = 3,
    ) -> T:
        """
        Uses LM Studio structured response to return a Pydantic-validated model.

        Args:
            messages: chat messages
            model: the Pydantic model class for output
            retries: how many times to retry if the response is invalid

        Returns:
            An instance of the model populated from structured JSON.
        """
        if not issubclass(model, BaseModel):
            raise ValueError("Schema must be a subclass of pydantic.BaseModel.")
        if not messages:
            raise ValueError("Input messages must not be empty.")

        payload = [{"role": msg.role, "content": msg.text} for msg in messages]

        for attempt in range(1, retries + 1):
            try:
                print(f"[Attempt {attempt}] Sending completion request...")
                response = self.client.chat.completions.create(
                    model=self.completion_model,
                    messages=payload,
                    response_format=model,
                    max_tokens=512,
                    temperature=0.2,
                )

                content = response.choices[0].message.content
                print(f"[Attempt {attempt}] Raw model content: {content}")

                parsed = model.model_validate_json(content)
                print(
                    f"[Attempt {attempt}] Successfully validated structured response.",
                )
                return parsed

            except ValidationError as ve:
                print(f"[Attempt {attempt}] Validation failed: {ve}")
            except json.JSONDecodeError as je:
                print(f"[Attempt {attempt}] JSON decode error: {je}")
            except Exception as e:  # noqa: BLE001
                print(f"[Attempt {attempt}] Unexpected error: {e}")

            if attempt == retries:
                raise RuntimeError(
                    f"Failed to get valid structured response after {retries} attempts.",
                )

    def get_image(
        self,
        prompt: str,
        **kwargs,
    ) -> List[GeneratedImage]:
        # TODO: maybe this pattern is sort of meh,
        # when each endpoint could be a different server?
        # or, we eventually put them all behind the same loader balancer
        # and use the same base_url for all of them.
        self.client.base_url = "http://host.docker.internal:9027/v1/"

        params = {
            "model": kwargs.get("model", self.image_model),
            "prompt": prompt,
            # maybe TODO?
            # negative_prompt: kwargs.get("negative_prompt", None),
            # "response_format": "b64_json",
            "n": 1,
            "size": kwargs.get("size", "1024x1024"),
        }
        # merge in any overrides (e.g. size="1536x1024", n=2)
        params.update(kwargs)
        resp: ImagesResponse = self.client.images.generate(**params)

        images: List[GeneratedImage] = []
        for img in resp.data:
            raw = base64.b64decode(img.b64_json)
            images.append(GeneratedImage(data=raw, format="png"))

        return images

    def get_embedding(self, text: str) -> List[float]:
        raise NotImplementedError(
            "Embeddings are not supported by this local client.",
        )
