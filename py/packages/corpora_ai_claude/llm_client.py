import json
import re
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
                    },
                )

        payload = {
            "model": self.completion_model,
            "max_tokens": 8192,
            "messages": anthropic_messages,
        }

        if system_message:
            payload["system"] = system_message

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        response = requests.post(
            f"{self.base_url}/v1/messages",
            json=payload,
            headers=headers,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Claude API error: {response.status_code} - {response.text}",
            )

        result = response.json()
        return result["content"][0]["text"]

    def get_data_completion(
        self,
        messages: List[ChatCompletionTextMessage],
        model: Type[T],
    ) -> T:
        """Get structured data completion from Claude."""
        # Add specific instructions for JSON output
        enhanced_messages = []
        system_message = None

        for msg in messages:
            if msg.role == "system":
                system_message = (
                    msg.text
                    + "\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text before or after the JSON. The response must be a single, valid JSON object that matches the required schema."
                )
            else:
                enhanced_messages.append(msg)

        # If no system message, create one
        if system_message is None:
            system_message = "You are a helpful assistant. IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text before or after the JSON. The response must be a single, valid JSON object."

        # Add the enhanced system message
        final_messages = [
            ChatCompletionTextMessage(role="system", text=system_message),
        ] + enhanced_messages

        completion_text = self.get_text_completion(final_messages)

        # Try to extract JSON from the response
        json_text = self._extract_json(completion_text)

        try:
            data_dict = json.loads(json_text)
            return model.model_validate(data_dict)
        except (json.JSONDecodeError, ValueError) as e:
            raise RuntimeError(
                f"Failed to parse Claude response as structured data: {e}. "
                f"Raw response: {completion_text[:500]}...",
            )

    def _extract_json(self, text: str) -> str:
        """Extract JSON from Claude's response, handling cases where there's extra text."""
        text = text.strip()

        # If the text starts and ends with braces, assume it's pure JSON
        if text.startswith("{") and text.endswith("}"):
            return text

        # Try to find JSON within the text

        # First, try to extract from markdown code blocks
        code_block_pattern = r"```(?:json)?\s*(\{.*?\})\s*```"
        code_matches = re.findall(code_block_pattern, text, re.DOTALL)
        if code_matches:
            # Return the longest match (most likely to be the complete JSON)
            return max(code_matches, key=len)

        # Look for JSON objects (starting with { and ending with })
        json_pattern = r"\{.*\}"
        matches = re.findall(json_pattern, text, re.DOTALL)

        if matches:
            # Return the longest match (most likely to be the complete JSON)
            return max(matches, key=len)

        # Look for JSON arrays (starting with [ and ending with ])
        array_pattern = r"\[.*\]"
        matches = re.findall(array_pattern, text, re.DOTALL)

        if matches:
            return max(matches, key=len)

        # If we can't find JSON structure, return the original text and let JSON parsing fail with a better error
        return text

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
