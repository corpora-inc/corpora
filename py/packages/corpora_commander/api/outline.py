from typing import Any, Dict, List
from uuid import UUID

from corpora_ai.llm_interface import ChatCompletionTextMessage
from django.shortcuts import get_object_or_404
from pydantic import BaseModel

from corpora_commander.models import Project

from .llm_utils import build_llm
from .router import router


class OutlineRequest(BaseModel):
    provider: str
    config: Dict[str, Any]


class SubsectionOutline(BaseModel):
    title: str
    order: int
    instructions: str


class SectionOutline(BaseModel):
    title: str
    order: int
    instructions: str
    subsections: List[SubsectionOutline]


class OutlineResponse(BaseModel):
    sections: List[SectionOutline]


@router.post("/projects/{project_id}/outline", response=OutlineResponse)
def generate_outline(
    request,
    project_id: UUID,
    payload: OutlineRequest,
):
    proj = get_object_or_404(Project, id=project_id)

    messages = [
        ChatCompletionTextMessage(
            role="system",
            text="You are an expert book-outliner.",
        ),
        ChatCompletionTextMessage(
            role="user",
            text=(
                f"title: {proj.title}\n"
                f"subtitle: {proj.subtitle}\n"
                f"purpose: {proj.purpose}\n"
                f"has_images: {proj.has_images}\n\n"
                f"Return JSON matching schema:\n"
                f"{OutlineResponse.model_json_schema()}"
            ),
        ),
    ]

    llm = build_llm(payload.provider, payload.config)
    outline = llm.get_data_completion(messages, OutlineResponse)
    return outline.model_dump()
