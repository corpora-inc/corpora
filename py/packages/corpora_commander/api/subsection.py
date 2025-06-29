from datetime import datetime
from typing import List, Optional
from uuid import UUID

from django.shortcuts import get_object_or_404
from pydantic import BaseModel

from corpora_commander.models import Section, Subsection

from .router import router


class SubsectionIn(BaseModel):
    title: str
    content: Optional[str] = ""
    instructions: Optional[str] = ""
    order: Optional[int] = 0


class SubsectionOut(SubsectionIn):
    id: UUID
    section_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubsectionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    instructions: Optional[str] = None
    order: Optional[int] = None


@router.get("/sections/{section_id}/subsections", response=List[SubsectionOut])
def list_subsections(request, section_id: UUID):
    section = get_object_or_404(Section, id=section_id)
    return section.subsections.all()


@router.post("/sections/{section_id}/subsections", response=SubsectionOut)
def create_subsection(request, section_id: UUID, payload: SubsectionIn):
    section = get_object_or_404(Section, id=section_id)
    sub = Subsection.objects.create(section=section, **payload.model_dump())
    return sub


@router.get("/subsections/{subsection_id}", response=SubsectionOut)
def get_subsection(request, subsection_id: UUID):
    return get_object_or_404(Subsection, id=subsection_id)


@router.put("/subsections/{subsection_id}", response=SubsectionOut)
def update_subsection(request, subsection_id: UUID, payload: SubsectionUpdate):
    sub = get_object_or_404(Subsection, id=subsection_id)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(sub, field, value)
    sub.save()
    return sub


@router.delete("/subsections/{subsection_id}")
def delete_subsection(request, subsection_id: UUID):
    sub = get_object_or_404(Subsection, id=subsection_id)
    sub.delete()
    return
