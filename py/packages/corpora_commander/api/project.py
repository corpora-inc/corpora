# corpora_commander/api/project.py

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from django.shortcuts import get_object_or_404
from pydantic import BaseModel, field_validator

from corpora_commander.models import Project

from .router import router


class ProjectIn(BaseModel):
    title: str
    subtitle: Optional[str] = ""
    purpose: Optional[str] = ""
    author: Optional[str] = ""
    publisher: Optional[str] = ""
    isbn: Optional[str] = ""
    language: Optional[str] = "en-US"
    publication_date: Optional[date] = None
    instructions: Optional[str] = ""
    voice: Optional[str] = ""
    has_images: bool = False  # new field


class ProjectOut(ProjectIn):
    id: UUID  # now a UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    purpose: Optional[str] = None
    instructions: Optional[str] = None
    voice: Optional[str] = None
    has_images: Optional[bool] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    isbn: Optional[str] = None
    language: Optional[str] = None
    publication_date: Optional[date] = None

    model_config = {"from_attributes": True}

    @field_validator("publication_date", mode="before")
    @classmethod
    def _empty_to_none(cls, v):
        # turn empty‐string or all‐whitespace into None
        if isinstance(v, str) and not v.strip():
            return None
        return v


@router.get("/projects/", response=List[ProjectOut])
def list_projects(request):
    """
    Return all projects, most recent first.
    """
    return Project.objects.order_by("-created_at").all()


@router.post("/projects/", response=ProjectOut)
def create_project(request, payload: ProjectIn):
    """
    Create a new project with the given metadata.
    """
    project = Project.objects.create(**payload.model_dump())
    return project


@router.get("/projects/{project_id}", response=ProjectOut)
def get_project(request, project_id: UUID):
    """
    Retrieve a single project by its ID.
    """
    project = get_object_or_404(Project, id=project_id)
    return project


@router.put("/projects/{project_id}", response=ProjectOut)
def update_project(request, project_id: UUID, payload: ProjectUpdate):
    proj = get_object_or_404(Project, id=project_id)
    data = payload.model_dump(exclude_unset=True)  # <— only the provided fields
    for field, value in data.items():
        setattr(proj, field, value)
    proj.save()
    return proj


@router.delete("/projects/{project_id}")
def delete_project(request, project_id: UUID):
    """
    Delete a project.
    """
    project = get_object_or_404(Project, id=project_id)
    project.delete()
    # Ninja will return 200 OK with empty body by default
    return
