# corpora_commander/api.py
from typing import List, Optional

import httpx
import openai
from corpora_ai.llm_interface import ChatCompletionTextMessage
from corpora_ai.provider_loader import load_llm_provider
from ninja import Router
from ninja.errors import HttpError
from pydantic import BaseModel, Field, HttpUrl

router = Router(tags=["commander"])


class ChatMessageSchema(BaseModel):
    role: str
    text: str


class CompletionRequest(BaseModel):
    provider: str = Field(..., description="one of: openai, xai, local")
    model: str = Field(..., description="model name to use")
    base_url: Optional[HttpUrl] = Field(
        None,
        description="only for providers that need a URL (e.g. local)",
    )
    api_key: Optional[str] = Field(
        None,
        description="override env var for key-based providers",
    )
    messages: List[ChatMessageSchema]


class CompletionResponse(BaseModel):
    text: str


@router.post("/complete", response=CompletionResponse)
def text_completion(request, data: CompletionRequest):
    # 1) Load the correct LLM provider (this can raise ValueError on bad config)
    print(f"Loading LLM provider: {data.provider}")
    print(f"Using model: {data.model}")
    print(f"Using base URL: {data.base_url}")
    print(f"Using API key: {data.api_key}")
    print(f"Using messages: {data.messages}")
    # return
    try:
        llm = load_llm_provider(
            provider_name=data.provider,
            completion_model=data.model,
            base_url=str(data.base_url) if data.base_url else None,
            api_key=data.api_key,
        )
    except ValueError as e:
        # configuration issue: return 400
        raise HttpError(400, str(e))

    # 2) Build the chat message list
    msgs = [
        ChatCompletionTextMessage(role=m.role, text=m.text)
        for m in data.messages
    ]

    # 3) Delegate to the provider. Any errors here bubble up as 500.
    result_text = llm.get_text_completion(msgs)

    return CompletionResponse(text=result_text)


class LMStudioPing(BaseModel):
    base_url: str


@router.post("/lmstudio/models")
def list_lmstudio_models(request, data: LMStudioPing):
    """
    Fetch the list of model names from LM Studio.
    """
    resp = httpx.get(f"{data.base_url}/models", timeout=5.0)
    if resp.status_code != 200:
        return request.error_out(status=resp.status_code, message=resp.text)
    models = resp.json()
    return {"models": models}


class OpenAIModelsRequest(BaseModel):
    api_key: Optional[str] = None


@router.post("/openai/models")
def list_openai_models(request, body: OpenAIModelsRequest):
    """
    Fetch the list of available OpenAI model IDs.
    If `api_key` is provided in the request body, it overrides the
    OPENAI_API_KEY environment variable for this call.
    """
    # 1) Configure the key (use env if none passed)
    if body.api_key:
        openai.api_key = body.api_key

    resp = openai.models.list()

    # 3) Extract the IDs
    model_ids = [m.id for m in resp.data]

    return {"models": model_ids}
