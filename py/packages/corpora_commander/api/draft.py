import logging
from typing import TYPE_CHECKING, Any, Dict, List
from uuid import UUID

from django.shortcuts import get_object_or_404
from pydantic import BaseModel

from corpora_commander.models import Project
from corpora_commander.prompts.builder import build_draft_messages

from .llm_utils import build_llm
from .router import router

if TYPE_CHECKING:
    from corpora_ai.llm_interface import ChatCompletionTextMessage

logger = logging.getLogger(__name__)


class DraftSubsection(BaseModel):
    subsection_id: UUID
    content: str


class DraftSection(BaseModel):
    section_id: UUID
    introduction: str
    subsections: List[DraftSubsection]


class DraftBookResponse(BaseModel):
    sections: List[DraftSection]


class DraftBookRequest(BaseModel):
    provider: str
    config: Dict[str, Any]
    prompt: str = "Please draft the full book based on the outline and instructions provided."


@router.post("/projects/{project_id}/draft", response=DraftBookResponse)
def draft_book(request, project_id: UUID, payload: DraftBookRequest):
    """
    Generate a draft for every section in the project, using the shared
    prompt-builder to enforce all markdown, image-token, and JSON rules.
    """
    logger.info("Starting full book draft for project %s", project_id)

    proj: Project = get_object_or_404(Project, id=project_id)
    sections = (
        proj.sections.order_by("order")
        .prefetch_related("subsections")  # avoid N+1
        .all()
    )

    llm = build_llm(payload.provider, payload.config)
    drafts: List[DraftSection] = []

    for sec in sections:
        logger.info("Drafting section %s (%s)", sec.id, sec.title)

        messages: List[ChatCompletionTextMessage] = build_draft_messages(
            project=proj,
            section=sec,
            user_prompt=payload.prompt,
            schema_json=DraftSection.model_json_schema(),
        )

        section_draft: DraftSection = llm.get_data_completion(
            messages,
            DraftSection,
        )

        drafts.append(section_draft)
        logger.info("Completed section %s", sec.id)

    logger.info("Completed full book draft for project %s", project_id)
    return DraftBookResponse(sections=drafts).model_dump()
