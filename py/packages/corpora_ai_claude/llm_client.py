import json
from typing import List, Type, TypeVar

import requests
from corpora_ai.llm_interface import (
    ChatCompletionTextMessage,
    GeneratedImage,
    LLMBaseInterface,
)
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class ClaudeClient(LLMBaseInterface):
    """
    Claude/Anthropic client for completions.
    """

    def __init__(
        self,
        api_key: str,
        completion_model: str = "claude-3-haiku-20240307",
        base_url: str = "https://api.anthropic.com",
    ):
        self.api_key = api_key
        self.completion_model = completion_model
        self.base_url = base_url.rstrip("/")

    def get_text_completion(
        self,
        messages: List[ChatCompletionTextMessage],
    ) -> str:
        """Get a text completion from Claude."""
        # Convert our messages to Anthropic format
        anthropic_messages = []
        system_message = None

        for msg in messages:
            if msg.role == "system":
                system_message = msg.text
            else:
                anthropic_messages.append(
                    {
                        "role": msg.role,
                        "content": msg.text,
                    }
                )

        payload = {
            "model": self.completion_model,
            "max_tokens": 1024,
            "messages": anthropic_messages,
        }

        if system_message:
            payload["system"] = system_message

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        response = requests.post(
            f"{self.base_url}/v1/messages",
            json=payload,
            headers=headers,
            timeout=30,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Claude API error: {response.status_code} - {response.text}"
            )

        result = response.json()
        return result["content"][0]["text"]

    def get_data_completion(
        self,
        messages: List[ChatCompletionTextMessage],
        model: Type[T],
    ) -> T:
        """Get structured data completion from Claude."""
        # For now, just get text completion and try to parse it as JSON
        completion_text = self.get_text_completion(messages)
        try:
            data_dict = json.loads(completion_text)
            return model.model_validate(data_dict)
        except (json.JSONDecodeError, ValueError) as e:
            raise RuntimeError(
                f"Failed to parse Claude response as structured data: {e}"
            )

    def get_image(
        self,
        prompt: str,
        **kwargs,
    ) -> List[GeneratedImage]:
        """Claude doesn't support image generation."""
        raise NotImplementedError("Claude doesn't support image generation")

    def get_embedding(self, text: str) -> List[float]:
        """Claude doesn't support embeddings."""
        raise NotImplementedError("Claude doesn't support embeddings")
