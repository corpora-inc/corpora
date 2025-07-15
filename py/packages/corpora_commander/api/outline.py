import logging
from typing import Any, Dict, List
from uuid import UUID

from django.shortcuts import get_object_or_404
from pydantic import BaseModel

from corpora_commander.models import Project
from corpora_commander.prompts.builder import build_outline_messages

from .llm_utils import build_llm
from .router import router

logger = logging.getLogger(__name__)


class OutlineRequest(BaseModel):
    provider: str
    config: Dict[str, Any]
    prompt: str


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
def generate_outline(request, project_id: UUID, payload: OutlineRequest):
    proj: Project = get_object_or_404(Project, id=project_id)

    messages = build_outline_messages(
        project=proj,
        user_prompt=payload.prompt,
        schema_json=OutlineResponse.model_json_schema(),
    )

    llm = build_llm(payload.provider, payload.config)
    outline: OutlineResponse = llm.get_data_completion(
        messages,
        OutlineResponse,
    )
    return outline.model_dump()
