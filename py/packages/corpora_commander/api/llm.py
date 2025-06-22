# corpora_commander/api/llm.py
from typing import Any, Dict, List, Optional, Type

from corpora_ai.llm_interface import ChatCompletionTextMessage
from corpora_ai.provider_loader import load_llm_provider
from pydantic import BaseModel, ValidationError, create_model

from corpora_commander.api import router


class GenericCompletionRequest(BaseModel):
    provider: str
    # any kwargs your load_llm_provider wants, e.g. api_key, base_url, model, etc.
    config: Dict[str, Any]
    messages: List[ChatCompletionTextMessage]
    # a simple JSON-schema–style mapping of field names → type names
    # e.g. {"title": "str", "pages": "int", "tags": "List[str]"}
    schema: Dict[str, str]


TYPE_MAP: Dict[str, Type[Any]] = {
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
    "List[str]": List[str],
    "List[int]": List[int],
    # …add whatever nested types you really need…
}


@router.post("/generic/complete", response=Dict[str, Any])
def generic_data_completion(request, payload: GenericCompletionRequest):
    """
    Take arbitrary messages + a simple schema description,
    invoke the configured LLM, and return a dict matching that schema.
    """
    # 1) Dynamically build a Pydantic model:
    fields: Dict[str, tuple] = {}
    for name, type_name in payload.schema.items():
        py_type = TYPE_MAP.get(type_name)
        if py_type is None:
            raise ValueError(f"Unsupported field type: {type_name!r}")
        # default to optional
        fields[name] = (
            Optional[py_type],
            None,
        )  # you can tweak default/required

    try:
        model: Type[BaseModel] = create_model(
            "DynamicModel",
            __config__=type("Config", (), {"from_attributes": True}),
            **fields,
        )
    except ValidationError as e:
        raise ValueError(f"Invalid schema description: {e}")

    # 2) Load the LLM client
    llm = load_llm_provider(**payload.config)
    if llm is None:
        raise ValueError("Could not initialize LLM provider")

    # 3) Invoke the generic get_data_completion
    result_obj = llm.get_data_completion(payload.messages, model)

    # 4) Return as plain dict
    return result_obj.model_dump()
