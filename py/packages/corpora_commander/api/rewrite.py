import logging
from typing import Any, Dict, List
from uuid import UUID

from django.shortcuts import get_object_or_404
from pydantic import BaseModel

from corpora_commander.models import Project
from corpora_commander.prompts.builder import (
    build_rewrite_section_messages,
    build_rewrite_subsection_messages,
)

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
    logger.info(
        "Starting rewrite of section introductions for project %s",
        project_id,
    )
    proj: Project = get_object_or_404(Project, id=project_id)
    sections = proj.sections.order_by("order")

    llm = build_llm(payload.provider, payload.config)
    results: List[RewriteSection] = []

    for sec in sections:
        logger.info("Rewriting section %s (%s)", sec.id, sec.title)

        messages = build_rewrite_section_messages(
            project=proj,
            section=sec,
            user_prompt=payload.prompt,
            schema_json=RewriteSection.model_json_schema(),
        )
        rewrite = llm.get_data_completion(messages, RewriteSection)
        results.append(rewrite)

    return results


@router.post(
    "/projects/{project_id}/rewrite/subsections",
    response=List[RewriteSubsection],
)
def rewrite_subsections(request, project_id: UUID, payload: RewriteRequest):
    logger.info(
        "Starting rewrite of subsection content for project %s",
        project_id,
    )
    proj: Project = get_object_or_404(Project, id=project_id)
    sections = proj.sections.order_by("order").prefetch_related("subsections")

    llm = build_llm(payload.provider, payload.config)
    results: List[RewriteSubsection] = []

    for sec in sections:
        for sub in sec.subsections.all().order_by("order"):
            logger.info("Rewriting subsection %s (%s)", sub.id, sub.title)

            messages = build_rewrite_subsection_messages(
                project=proj,
                section=sec,
                sub=sub,
                user_prompt=payload.prompt,
                schema_json=RewriteSubsection.model_json_schema(),
            )
            rewrite = llm.get_data_completion(messages, RewriteSubsection)
            results.append(rewrite)

    return results
