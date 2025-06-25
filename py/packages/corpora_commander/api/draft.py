import logging
from typing import Any, Dict, List
from uuid import UUID

from corpora_ai.llm_interface import ChatCompletionTextMessage
from django.shortcuts import get_object_or_404
from pydantic import BaseModel

from corpora_commander.models import Project

from .llm_utils import build_llm
from .router import router

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
    Iterate over each section of the project, invoke the LLM to draft that section
    (with strict enforcement of no markdown headers in introductions and subsections
    starting with '## {title}'), and return all drafts together.
    """
    logger.info("Starting full book draft for project %s", project_id)
    proj = get_object_or_404(Project, id=project_id)
    sections = proj.sections.order_by("order").prefetch_related("subsections")

    llm = build_llm(payload.provider, payload.config)
    drafts: List[DraftSection] = []

    for sec in sections:
        logger.info("Drafting section %s (%s)", sec.id, sec.title)

        # System prompt: enforce structure
        sys_text = (
            "You are an expert book author. Draft a cohesive section of a book "
            "based on the provided metadata, section introduction, and subsection instructions. "
            "Strictly enforce:\n"
            "  • The 'introduction' field must contain plain text only (no markdown headers).\n"
            "  • Each subsection's 'content' must begin with a level-2 markdown header "
            "(i.e., '## {subsection title}') followed by the body.\n"
            "Always return valid JSON matching the requested schema exactly."
        )
        if proj.has_images:
            sys_text += (
                " When appropriate, insert tokens like "
                "{{IMAGE: <caption>}} in subsection content."
            )

        system_msg = ChatCompletionTextMessage(role="system", text=sys_text)

        # Build context including IDs
        ctx_lines: List[str] = [f"Project Title: {proj.title}"]
        if proj.subtitle:
            ctx_lines.append(f"Project Subtitle: {proj.subtitle}")
        if proj.purpose:
            ctx_lines.append(f"Project Purpose: {proj.purpose}")
        if proj.voice:
            ctx_lines.append(f"Project Voice: {proj.voice}")
        ctx_lines.append("")
        ctx_lines.append(f"Section Title: {sec.title}")
        ctx_lines.append(f"Section ID: {sec.id}")
        if sec.instructions:
            ctx_lines.append(f"Section Instructions: {sec.instructions}")
        ctx_lines.append("")

        for sub in sec.subsections.all().order_by("order"):
            ctx_lines.append(f"Subsection Title: {sub.title}")
            ctx_lines.append(f"Subsection ID: {sub.id}")
            if sub.instructions:
                ctx_lines.append(f"Subsection Instructions: {sub.instructions}")
            ctx_lines.append("")

        context = "\n".join(ctx_lines)

        user_msg = ChatCompletionTextMessage(
            role="user",
            text=(
                f"{context}\n"
                f"Prompt: {payload.prompt}\n\n"
                f"Return a JSON object matching this schema exactly:\n"
                f"{DraftSection.model_json_schema()}"
            ),
        )

        # Invoke LLM and collect draft
        section_draft = llm.get_data_completion(
            [system_msg, user_msg],
            DraftSection,
        )
        drafts.append(section_draft)
        logger.info("Completed drafting section %s", sec.id)

    logger.info("Completed full book draft for project %s", project_id)
    response = DraftBookResponse(sections=drafts)
    return response.model_dump()
