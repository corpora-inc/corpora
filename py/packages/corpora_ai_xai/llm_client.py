from typing import List, Type, TypeVar

from corpora_ai.llm_interface import ChatCompletionTextMessage, LLMBaseInterface
from openai import OpenAI, OpenAIError
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class XAIClient(LLMBaseInterface):
    """
    Grok/XAI client supporting tool-calling (a.k.a. function-calling).
    """

    def __init__(
        self,
        api_key: str,
        completion_model: str = "grok-3-fast",
        # completion_model: str = "grok-3-mini-fast-beta",
        base_url: str = "https://api.x.ai/v1",
        # XAI has no embedding model
    ):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.completion_model = completion_model

    def get_text_completion(
        self,
        messages: List[ChatCompletionTextMessage],
    ) -> str:
        if not messages:
            raise ValueError("Input messages must not be empty.")
        payload = [{"role": m.role, "content": m.text} for m in messages]
        resp = self.client.chat.completions.create(
            model=self.completion_model,
            messages=payload,
        )
        return resp.choices[0].message.content

    def get_data_completion(
        self,
        messages: List[ChatCompletionTextMessage],
        model: Type[T],
        retries: int = 3,
    ) -> T:
        """
        Uses XAI tool-calling to return a Pydantic-validated model.

        Args:
          messages: chat messages
          model: the Pydantic model class for output
          tool_name: name of the tool/function to invoke
          tool_description: description for the tool

        Returns:
          An instance of `model` populated from the tool_call arguments.
        """
        if not issubclass(model, BaseModel):
            raise ValueError("Schema must subclass pydantic.BaseModel.")
        if not messages:
            raise ValueError("Input messages must not be empty.")

        print(f"XAI: {model.__name__} tool-calling")
        tool_name = f"{model.__name__}"
        tool_description = (
            f"Generate data based on the provided parameters {tool_name} schema"
        )

        payload = [{"role": m.role, "content": m.text} for m in messages]
        schema = model.model_json_schema()
        # XAI expects a `tools` list with function definitions:
        tool_def = {
            "type": "function",
            "function": {
                "name": tool_name,
                "description": tool_description,
                "parameters": schema,
            },
        }

        tries = 0
        while tries < retries:
            tries += 1
            try:
                resp = self.client.chat.completions.create(
                    model=self.completion_model,
                    messages=payload,
                    tools=[tool_def],
                    tool_choice={
                        "type": "function",
                        "function": {"name": tool_name},
                    },
                )
                msg = resp.choices[0].message
                if not getattr(msg, "tool_calls", None):
                    # raise RuntimeError("No tool_call in XAI response")
                    if tries >= retries:
                        raise RuntimeError("No tool_call in XAI response")
                    continue
                call = msg.tool_calls[0]
                if call.function.name != tool_name:
                    if tries >= retries:
                        raise RuntimeError(
                            f"Unexpected tool: {call.function.name}",
                        )
                    continue

                # The arguments are a JSON string:
                data = model.model_validate_json(call.function.arguments)
                return data

            except OpenAIError as e:
                if tries >= retries:
                    raise RuntimeError(f"XAI request failed: {e}")
                print(f"XAI request failed: {e}")
                continue

    def get_embedding(self, text: str) -> List[float]:
        raise NotImplementedError(
            "XAI does not support embedding generation. "
            "Use OpenAIClient for embedding generation.",
        )
