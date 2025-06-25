import logging
from typing import Any, Dict, List
from uuid import UUID

from corpora_ai.llm_interface import ChatCompletionTextMessage
from django.shortcuts import get_object_or_404
from pydantic import BaseModel, Field

from corpora_commander.models import Project

from .llm_utils import build_llm
from .router import router

logger = logging.getLogger(__name__)


class DraftSubsection(BaseModel):
    subsection_id: UUID = Field(..., description="UUID of the subsection")
    content: str = Field(
        ...,
        description=(
            "Markdown content for this subsection. "
            "MUST start with '## {title}' where {title} is the subsection title."
        ),
    )


class DraftSection(BaseModel):
    section_id: UUID = Field(..., description="UUID of the section")
    introduction: str = Field(
        ...,
        description="Plain text introduction for the section. No markdown headers.",
    )
    subsections: List[DraftSubsection] = Field(
        ...,
        description="List of drafted subsections, in order.",
    )


class DraftBookResponse(BaseModel):
    sections: List[DraftSection]


class DraftBookRequest(BaseModel):
    provider: str = Field(..., description="LLM provider name (e.g. openai)")
    config: Dict[str, Any] = Field(
        ...,
        description="Provider-specific configuration",
    )
    prompt: str = Field(
        "Please draft the full book based on the outline and instructions provided.",
        description="Instruction to pass to the LLM for drafting",
    )


@router.post("/projects/{project_id}/draft", response=DraftBookResponse)
def draft_book(request, project_id: UUID, payload: DraftBookRequest):
    """
    For each section in the project, ask the LLM to draft an introduction
    and each subsection's content. Returns a DraftBookResponse containing
    all sections and their generated content with UUIDs preserved.
    """
    proj = get_object_or_404(
        Project.objects.prefetch_related("sections__subsections").order_by(
            "sections__order",
        ),
        id=project_id,
    )
    sections_qs = proj.sections.all()
    llm = build_llm(payload.provider, payload.config)

    drafts: List[DraftSection] = []
    total = sections_qs.count()

    for idx, sec in enumerate(sections_qs, start=1):
        logger.info("Drafting section %d/%d: %s", idx, total, sec.title)

        # Build system message
        sys_text = (
            "You are an expert technical writer. "
            "Draft a cohesive section based on the provided project metadata "
            "and section instructions."
        )
        if proj.has_images:
            sys_text += (
                " When appropriate, include tokens like {{IMAGE: <caption>}} "
                "in the subsection content."
            )
        system_msg = ChatCompletionTextMessage(role="system", text=sys_text)

        # Build context for this section
        ctx_lines = [
            f"Project Title: {proj.title}",
            *(f"Subtitle: {proj.subtitle}" for _ in [1] if proj.subtitle),
            *(f"Purpose: {proj.purpose}" for _ in [1] if proj.purpose),
            *(f"Voice: {proj.voice}" for _ in [1] if proj.voice),
            f"Section Title: {sec.title}",
            *(
                f"Section Instructions: {sec.instructions}"
                for _ in [1]
                if sec.instructions
            ),
            "",
        ]
        for sub in sec.subsections.all().order_by("order"):
            ctx_lines.append(f"Subsection Title: {sub.title}")
            if sub.instructions:
                ctx_lines.append(f"Subsection Instructions: {sub.instructions}")
            ctx_lines.append("")

        context = "\n".join(ctx_lines)

        # Build user message with schema reminder
        user_msg = ChatCompletionTextMessage(
            role="user",
            text=(
                f"{context}\n"
                f"Prompt: {payload.prompt}\n\n"
                f"Return JSON matching Pydantic DraftSection schema:\n"
                f"{DraftSection.model_json_schema()}"
            ),
        )

        # Request the draft for this section
        section_draft = llm.get_data_completion(
            [system_msg, user_msg],
            DraftSection,
        )

        # Enforce no markdown headers in introduction
        if section_draft.introduction.strip().startswith("#"):
            logger.warning(
                "Section %s introduction starts with markdown header; stripping.",
                sec.id,
            )
            # remove any leading '#' lines
            lines = section_draft.introduction.splitlines()
            section_draft.introduction = "\n".join(
                li for li in lines if not li.lstrip().startswith("#")
            ).strip()

        # Enforce each subsection begins with '## {title}'
        for sub in section_draft.subsections:
            expected_hdr = (
                f"## {sec.subsections.get(id=sub.subsection_id).title}"
            )
            if not sub.content.lstrip().startswith(expected_hdr):
                logger.warning(
                    "Subsection %s content missing expected header; prepending.",
                    sub.subsection_id,
                )
                sub.content = f"{expected_hdr}\n\n{sub.content.lstrip()}"

        drafts.append(section_draft)
        logger.info("Finished drafting section %s", sec.id)

    response = DraftBookResponse(sections=drafts)
    return response.model_dump()
