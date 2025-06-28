# py/packages/corpora_commander/api/rewrite.py
import logging
from typing import Any, Dict, List
from uuid import UUID

from corpora_ai.llm_interface import ChatCompletionTextMessage
from django.shortcuts import get_object_or_404
from pydantic import BaseModel

from corpora_commander.models import Project, Section, Subsection

from .llm_utils import build_llm
from .router import router

logger = logging.getLogger(__name__)


class RewriteSection(BaseModel):
    section_id: UUID
    introduction: str


class RewriteSubsection(BaseModel):
    id: UUID
    content: str
    title: str = ""


class RewriteRequest(BaseModel):
    provider: str
    config: Dict[str, Any]
    prompt: str = (
        "Please rewrite the content, preserving meaning and improving style."
    )


@router.post(
    "/projects/{project_id}/rewrite/sections",
    response=List[RewriteSection],
)
def rewrite_sections(request, project_id: UUID, payload: RewriteRequest):
    """
    Rewrite all section introductions based on existing instructions and original intros.
    Returns proposed new introductions for review.
    """
    logger.info(
        "Starting rewrite of section introductions for project %s",
        project_id,
    )
    proj = get_object_or_404(Project, id=project_id)
    sections = proj.sections.order_by("order").all()

    llm = build_llm(payload.provider, payload.config)
    results: List[RewriteSection] = []

    for sec in sections:
        logger.info("Rewriting section %s (%s)", sec.id, sec.title)
        system_msg = ChatCompletionTextMessage(
            role="system",
            text=(
                "You are an expert book editor. Rewrite the section introduction "
                "to improve clarity and style, preserving original meaning."
            ),
        )
        # Build context
        ctx = [
            f"Project Title: {proj.title}",
            f"Section Title: {sec.title}",
            f"Section ID: {sec.id}",
        ]
        if sec.instructions:
            ctx.append(f"Section Instructions: {sec.instructions}")
        if sec.introduction:
            ctx.append(f"Original Introduction: {sec.introduction}")
        context = "\n".join(ctx)

        user_msg = ChatCompletionTextMessage(
            role="user",
            text=(
                f"{context}\n"
                f"Prompt: {payload.prompt}\n\n"
                f"Return a JSON object matching schema: {RewriteSection.model_json_schema()}"
            ),
        )
        section_result = llm.get_data_completion(
            [system_msg, user_msg],
            RewriteSection,
        )
        results.append(section_result)
        logger.info("Completed rewrite of section %s", sec.id)

    return results


@router.post(
    "/projects/{project_id}/rewrite/subsections",
    response=List[RewriteSubsection],
)
def rewrite_subsections(request, project_id: UUID, payload: RewriteRequest):
    """
    Rewrite all subsection content based on existing instructions and original content.
    Returns proposed new content for review.
    """
    logger.info(
        "Starting rewrite of subsection content for project %s",
        project_id,
    )
    proj = get_object_or_404(Project, id=project_id)
    sections = proj.sections.order_by("order").prefetch_related("subsections")

    llm = build_llm(payload.provider, payload.config)
    results: List[RewriteSubsection] = []

    for sec in sections:
        sec: Section
        for sub in sec.subsections.all().order_by("order"):
            sub: Subsection
            logger.info("Rewriting subsection %s (%s)", sub.id, sub.title)
            system_msg = ChatCompletionTextMessage(
                role="system",
                text=("You are an expert book editor."),
            )
            ctx = [
                f"Project Title: {proj.title}",
                f"Section Title: {sec.title}",
                f"Subsection ID: {sub.id}",
                f"Subsection Title: {sub.title}",
                f"Instructions: {sub.instructions}",
                f"Original Content: {sub.content}",
            ]
            context = "\n".join(ctx)

            user_msg = ChatCompletionTextMessage(
                role="user",
                text=(
                    f"{context}\n"
                    f"Prompt: {payload.prompt}\n\n"
                    f"Return a JSON object matching schema: {RewriteSubsection.model_json_schema()}"
                    f"Preserve the original subsection ID ({sub.id})"
                ),
            )
            sub_result = llm.get_data_completion(
                [system_msg, user_msg],
                RewriteSubsection,
            )
            results.append(sub_result)
            logger.info("Completed rewrite of subsection %s", sub.id)

    return results
