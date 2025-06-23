# corpora_commander/api/llm.py
from typing import Any, Dict, List, Optional, Type

from corpora_ai.llm_interface import ChatCompletionTextMessage
from corpora_ai.provider_loader import load_llm_provider
from pydantic import BaseModel, ValidationError, create_model

from .router import router  # adjust if your router is imported differently


class GenericCompletionRequest(BaseModel):
    provider: str
    config: Dict[str, Any]
    messages: List[ChatCompletionTextMessage]
    fields_schema: Dict[str, str]  # e.g. {"title": "str", "pages": "int"}


# simple map from your schema types → Python types
TYPE_MAP: Dict[str, Type[Any]] = {
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
    "List[str]": List[str],
    "List[int]": List[int],
}


@router.post("/generic/complete", response=Dict[str, Any])
def generic_data_completion(request, payload: GenericCompletionRequest):
    """Dynamically build a Pydantic model from `schema`, invoke the LLM,
    and return a dict matching that schema."""
    # 1) build the Pydantic model
    fields: Dict[str, tuple] = {}
    for name, type_name in payload.schema.items():
        py_type = TYPE_MAP.get(type_name)
        if py_type is None:
            raise ValueError(f"Unsupported field type: {type_name!r}")
        # make every field Optional[T], defaulting to None
        fields[name] = (Optional[py_type], None)

    try:
        DynamicModel = create_model(  # noqa
            "DynamicModel",
            __config__={"from_attributes": True},
            **fields,
        )
    except ValidationError as e:
        raise ValueError(f"Invalid schema description: {e}")

    # 2) un-pack and sanitize your config for load_llm_provider
    provider = payload.provider.lower()
    raw = payload.config or {}
    llm_kwargs: Dict[str, Any] = {}

    if provider == "openai":
        # map your store keys → client-init args
        api_key = raw.get("api_key") or raw.get("apiKey")
        default_model = raw.get("defaultModel") or raw.get("model")
        if api_key:
            llm_kwargs["api_key"] = api_key
        if default_model:
            llm_kwargs["completion_model"] = default_model

    elif provider == "xai":
        api_key = raw.get("api_key") or raw.get("apiKey")
        if api_key:
            llm_kwargs["api_key"] = api_key

    elif provider in ("lmstudio", "local"):
        # LMStudio is your local client
        base_url = raw.get("base_url") or raw.get("baseUrl")
        api_key = raw.get("api_key") or raw.get("apiKey")
        if base_url:
            llm_kwargs["base_url"] = base_url
        if api_key:
            llm_kwargs["api_key"] = api_key

    else:
        raise ValueError(f"Unknown provider: {payload.provider!r}")

    # 3) instantiate the right client
    #    note: provider_name must match what load_llm_provider expects
    provider_name = "local" if provider == "lmstudio" else provider
    llm = load_llm_provider(provider_name=provider_name, **llm_kwargs)
    if llm is None:
        raise ValueError(f"Could not initialize LLM provider {provider_name!r}")

    # 4) call into your LLMBaseInterface
    result = llm.get_data_completion(
        payload.messages,
        DynamicModel,
    )

    # 5) and return as plain dict
    return result.model_dump()
