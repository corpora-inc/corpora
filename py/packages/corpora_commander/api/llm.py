from typing import Any, Dict, List, Optional, Type

from corpora_ai.llm_interface import ChatCompletionTextMessage
from pydantic import BaseModel, ValidationError, create_model

from .llm_utils import build_llm
from .router import router


class GenericCompletionRequest(BaseModel):
    provider: str
    config: Dict[str, Any]
    messages: List[ChatCompletionTextMessage]
    fields_schema: Dict[str, str]


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
    missing = [t for t in payload.fields_schema.values() if t not in TYPE_MAP]
    if missing:
        raise ValueError(f"Unsupported field type(s): {missing}")

    fields: Dict[str, tuple] = {
        name: (Optional[TYPE_MAP[t]], None)
        for name, t in payload.fields_schema.items()
    }

    try:
        DynamicModel = create_model(  # noqa
            "DynamicModel",
            __config__={"from_attributes": True},
            **fields,
        )
    except ValidationError as e:
        raise ValueError(f"Invalid schema description: {e}")

    print(
        "building LLM with provider:",
        payload.provider,
        "and config:",
        payload.config,
    )
    llm = build_llm(payload.provider, payload.config)
    print("LLM built successfully", llm)
    result = llm.get_data_completion(payload.messages, DynamicModel)
    return result.model_dump()
