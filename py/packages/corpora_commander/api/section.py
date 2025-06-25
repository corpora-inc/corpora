from datetime import datetime
from typing import List, Optional
from uuid import UUID

from django.shortcuts import get_object_or_404
from pydantic import BaseModel

from corpora_commander.models import Project, Section

from .router import router
from .subsection import SubsectionOut


class SectionIn(BaseModel):
    title: str
    introduction: Optional[str] = ""
    instructions: Optional[str] = ""
    order: Optional[int] = 0


class SectionOut(SectionIn):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SectionWithSubsections(SectionOut):
    subsections: List[SubsectionOut]


class SectionUpdate(BaseModel):
    title: Optional[str] = None
    introduction: Optional[str] = None
    instructions: Optional[str] = None
    order: Optional[int] = None


@router.get(
    "/projects/{project_id}/sections",
    response=List[SectionWithSubsections],
)
def list_sections(request, project_id: UUID):
    project = get_object_or_404(
        Project.objects.prefetch_related("sections__subsections"),
        id=project_id,
    )
    return project.sections.all()


@router.post("/projects/{project_id}/sections", response=SectionOut)
def create_section(request, project_id: UUID, payload: SectionIn):
    project = get_object_or_404(Project, id=project_id)
    section = Section.objects.create(project=project, **payload.model_dump())
    return section


@router.get("/sections/{section_id}", response=SectionOut)
def get_section(request, section_id: UUID):
    return get_object_or_404(Section, id=section_id)


@router.put("/sections/{section_id}", response=SectionOut)
def update_section(request, section_id: UUID, payload: SectionUpdate):
    section = get_object_or_404(Section, id=section_id)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(section, field, value)
    section.save()
    return section


@router.delete("/sections/{section_id}")
def delete_section(request, section_id: UUID):
    section = get_object_or_404(Section, id=section_id)
    section.delete()
    return
