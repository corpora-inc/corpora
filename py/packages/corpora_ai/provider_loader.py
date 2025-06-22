import os
from typing import Optional

from corpora_ai_local.llm_client import LocalClient
from corpora_ai_openai.llm_client import OpenAIClient
from corpora_ai_xai.llm_client import XAIClient

from corpora_ai.llm_interface import LLMBaseInterface

# Future imports for other providers,
# e.g., Anthropic or Cohere, would follow the same pattern


def load_llm_provider(provider_name="", **kwargs) -> Optional[LLMBaseInterface]:
    """Dynamically loads the best LLM provider based on environment variables.

    Returns:
        Optional[LLMBaseInterface]: An instance of the best available LLM provider.

    """
    # TODO: we need to specify the model in the interface really
    # model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")

    # Passed argument takes precedence over environment variable
    if not provider_name:
        provider_name = os.getenv("LLM_PROVIDER", "openai")

    # Check for the OpenAI provider
    if provider_name == "openai":
        api_key = kwargs.pop("api_key", None)
        kwargs.pop("base_url", None)
        if not api_key:
            api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set.")
        return OpenAIClient(
            api_key=api_key,
            # completion_model=model_name,
            azure_endpoint=os.getenv("OPENAI_AZURE_ENDPOINT", None),
            **kwargs,
        )

    if provider_name == "xai":
        api_key = kwargs.pop("api_key", None)
        # ... XAIClient has base_url :shrug:
        kwargs.pop("base_url", None)
        if not api_key:
            api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("XAI_API_KEY environment variable is not set.")
        return XAIClient(
            api_key=api_key,
            **kwargs,
        )

    if provider_name == "local":
        return LocalClient(**kwargs)

    # Placeholder for additional providers (e.g., Anthropic)
    # elif provider_name == "anthropic" and AnthropicClient:
    #     return AnthropicClient(api_key=os.getenv("ANTHROPIC_API_KEY"))

    raise ValueError("No valid LLM provider found.")
