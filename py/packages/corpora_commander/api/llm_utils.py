from typing import Any, Dict

from corpora_ai.llm_interface import LLMBaseInterface
from corpora_ai.provider_loader import load_llm_provider


# TODO: fix/split this function. It is too complex and hacky at that.
def build_llm(provider: str, config: Dict[str, Any]) -> LLMBaseInterface:  # noqa: C901
    p = provider.lower()
    kwargs: Dict[str, Any] = {}

    if p == "openai":
        api_key = config.get("api_key") or config.get("apiKey")
        model = config.get("model") or config.get("defaultModel")
        if api_key:
            kwargs["api_key"] = api_key
        if model:
            kwargs["completion_model"] = model

    elif p == "xai":
        api_key = config.get("api_key") or config.get("apiKey")
        if api_key:
            kwargs["api_key"] = api_key

    elif p in ("lmstudio", "local"):
        base_url = config.get("base_url") or config.get("baseUrl")
        api_key = config.get("api_key") or config.get("apiKey")
        model = (
            config.get("completion_model")
            or config.get("model")
            or config.get("defaultModel")
        )
        if base_url:
            kwargs["base_url"] = base_url
        if api_key:
            kwargs["api_key"] = api_key
        if model:
            kwargs["completion_model"] = model

    else:
        raise ValueError(f"Unknown provider: {provider!r}")

    name = "local" if p == "lmstudio" else p
    llm = load_llm_provider(provider_name=name, **kwargs)
    if llm is None:
        raise ValueError(f"Could not initialize LLM provider {name!r}")
    return llm
