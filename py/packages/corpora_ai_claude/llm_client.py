from __future__ import annotations

from typing import Any, TypeVar

from anthropic import Anthropic
from anthropic.types import ContentBlock, TextBlock, ToolUseBlock
from corpora_ai.llm_interface import (
    ChatCompletionTextMessage,
    GeneratedImage,
    LLMBaseInterface,
)
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class ClaudeClient(LLMBaseInterface):
    """
    Anthropic Claude client (SDK-only) with first-class tool/function calling.

    - get_text_completion: plain text via Messages API
    - get_data_completion: forces a single tool with input_schema from a Pydantic model
      and returns a validated instance of that model
    """

    def __init__(
        self,
        api_key: str,
        completion_model: str = "claude-opus-4-1",
        # default_max_tokens: int = 2048,
    ):
        self.client = Anthropic(api_key=api_key)
        self.completion_model = completion_model
        # self.default_max_tokens = default_max_tokens

    # ---------- Public API ----------

    def get_text_completion(
        self,
        messages: list[ChatCompletionTextMessage],
    ) -> str:
        """Get a plain text completion from Claude (no tools)."""
        system, conversa = _split_system_and_messages(messages)

        msg = self.client.messages.create(
            model=self.completion_model,
            # max_tokens=self.default_max_tokens,
            messages=conversa,
            system=system,
        )
        return _concat_text_blocks(msg.content)

    def get_data_completion(
        self,
        messages: list[ChatCompletionTextMessage],
        model: type[T],
    ) -> T:
        """
        Structured output using Anthropic tool use.

        - Defines a single tool "return_json" with input_schema derived from `model`.
        - Forces the tool call via `tool_choice={"type": "tool", "name": "return_json"}`.
        - Extracts the ToolUseBlock.input and validates with Pydantic (raises on mismatch).
        """
        system, conversa = _split_system_and_messages(messages)

        tool_name = "return_json"
        tools = [
            {
                "name": tool_name,
                "description": "Return the final answer strictly as JSON conforming to input_schema.",
                "input_schema": model.model_json_schema(),
            },
        ]

        msg = self.client.messages.create(
            model=self.completion_model,
            max_tokens=10000,
            messages=conversa,
            system=system,
            tools=tools,
            tool_choice={"type": "tool", "name": tool_name},
        )

        tool_input = _extract_tool_input(msg.content, tool_name)
        return model.model_validate(tool_input)

    # ---------- Unsupported API ----------

    def get_image(self, prompt: str, **kwargs) -> list[GeneratedImage]:
        raise NotImplementedError("Claude doesn't support image generation")

    def get_embedding(self, text: str) -> list[float]:
        raise NotImplementedError("Claude doesn't support embeddings")


# ---------- Helpers ----------


def _split_system_and_messages(
    messages: list[ChatCompletionTextMessage],
) -> tuple[str | None, list[dict[str, str]]]:
    """
    Convert our message objects to Anthropic Messages API format:
    - Anthropic uses a top-level `system` instead of a 'system' role message.
    - `messages` is a list of {role: "user"|"assistant", content: str}.
    """
    system_parts: list[str] = []
    conversa: list[dict[str, str]] = []

    for m in messages:
        if m.role == "system":
            system_parts.append(m.text)
        else:
            conversa.append({"role": m.role, "content": m.text})

    system = (
        "\n\n".join(p.strip() for p in system_parts) if system_parts else None
    )
    return system, conversa


def _concat_text_blocks(blocks: list[ContentBlock]) -> str:
    """Join TextBlock contents from the assistant message."""
    return "".join(b.text for b in blocks if isinstance(b, TextBlock)).strip()


def _extract_tool_input(
    blocks: list[ContentBlock],
    tool_name: str,
) -> dict[str, Any]:
    """
    Find the first ToolUseBlock for `tool_name` and return its `input` as a dict.
    """
    for b in blocks:
        if isinstance(b, ToolUseBlock) and b.name == tool_name:
            if not isinstance(b.input, dict):
                raise RuntimeError("Tool input was not a JSON object")
            return b.input  # type: ignore[return-value]
    raise RuntimeError(f"Claude did not produce tool_use for {tool_name!r}")
