import base64
from typing import TYPE_CHECKING, List, Type, TypeVar

from corpora_ai.llm_interface import (
    ChatCompletionTextMessage,
    GeneratedImage,
    LLMBaseInterface,
)
from openai import AzureOpenAI, OpenAI
from pydantic import BaseModel

if TYPE_CHECKING:
    from openai.types.images_response import ImagesResponse


T = TypeVar("T", bound=BaseModel)


class OpenAIClient(LLMBaseInterface):
    def __init__(
        self,
        api_key: str,
        # TODO: we probably do need some way
        # to specify in runtime which model to use ;/
        # I think we will have to expand the interface with options
        # completion_model: str = "gpt-4o-mini",
        # completion_model: str = "gpt-4o",
        # completion_model: str = "o3-mini",
        # completion_model: str = "o4-mini",
        # completion_model: str = "o3",
        # completion_model: str = "gpt-4.1",
        # completion_model: str = "gpt-5-pro",
        completion_model: str = "gpt-5.1",
        embedding_model: str = "text-embedding-3-small",
        image_model: str = "gpt-image-1",
        azure_endpoint: str | None = None,
    ):
        if azure_endpoint:
            self.client = AzureOpenAI(
                api_key=api_key,
                azure_endpoint=azure_endpoint,
                # TODO: we should make this a parameter or what?
                api_version="2024-10-01-preview",
            )
        else:
            self.client = OpenAI(api_key=api_key)

        self.completion_model = completion_model
        self.embedding_model = embedding_model
        self.image_model = image_model

    def get_text_completion(
        self,
        messages: List[ChatCompletionTextMessage],
    ) -> str:
        if not messages:
            raise ValueError("Input messages must not be empty.")

        # Responses API uses `input` instead of `messages`
        # but still accepts the familiar role/content shape.
        input_items = [
            {"role": msg.role, "content": msg.text} for msg in messages
        ]

        response = self.client.responses.create(
            model=self.completion_model,
            input=input_items,
        )

        # The Responses API exposes a convenience property for text output.
        # This should be present for normal text generations.
        output_text = getattr(response, "output_text", None)
        if isinstance(output_text, str):
            return output_text

        # Fallback: walk the structured output if `output_text`
        # is unexpectedly missing.
        for item in getattr(response, "output", []):
            content = getattr(item, "content", None)
            if not content:
                continue
            first = content[0]
            text_val = getattr(first, "text", None)
            if isinstance(text_val, str):
                return text_val

        raise RuntimeError("No text content found in OpenAI Responses output.")

    def get_data_completion(
        self,
        messages: List[ChatCompletionTextMessage],
        model: Type[T],
    ) -> T:
        """Generates structured data completion using the Responses API.

        Args:
            messages: Input messages for the completion.
            model: A Pydantic model class to validate and structure the output.

        Returns:
            An instance of the provided Pydantic model populated with data.
        """
        if not issubclass(model, BaseModel):
            raise ValueError("Schema must be a subclass of pydantic.BaseModel.")

        if not messages:
            raise ValueError("Input messages must not be empty.")

        input_items = [
            {"role": msg.role, "content": msg.text} for msg in messages
        ]

        # Use the Responses API structured-output helper.
        # `text_format=model` tells the client to parse directly into the
        # provided Pydantic model type.
        response = self.client.responses.parse(
            model=self.completion_model,
            input=input_items,
            text_format=model,
        )

        # For structured outputs, the parsed value is attached to the content.
        # With a single primary output, we take the first item.
        try:
            parsed = response.output[0].content[0].parsed  # type: ignore[attr-defined]
        except (AttributeError, IndexError, KeyError) as e:
            raise RuntimeError(
                f"Failed to extract parsed structured output: {e}",
            )

        return parsed

    def get_image(
        self,
        prompt: str,
        **kwargs,
    ) -> List[GeneratedImage]:
        """
        Generate one or more images.

        Args:
            prompt: Natural-language description of the desired image.
            kwargs: Passed through to OpenAI API (e.g. n, size).

        Returns:
            A list of GeneratedImage with raw bytes and the appropriate format ("png").
        """
        params = {
            "model": self.image_model,
            "prompt": prompt,
            "n": 1,
            "size": "1024x1024",
        }
        params.update(kwargs)
        resp: ImagesResponse = self.client.images.generate(**params)

        images: List[GeneratedImage] = []
        for img in resp.data:
            raw = base64.b64decode(img.b64_json)
            images.append(GeneratedImage(data=raw, format="png"))

        return images

    def get_embedding(self, text: str) -> List[float]:
        if not text:
            raise ValueError("Input text must not be empty.")
        response = self.client.embeddings.create(
            input=text,
            model=self.embedding_model,
        )
        return response.data[0].embedding
