# corpora_commander/api/project.py

from datetime import date, datetime
from typing import List, Optional

from django.shortcuts import get_object_or_404
from pydantic import BaseModel

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


class ProjectOut(ProjectIn):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectUpdate(BaseModel):
    title: Optional[str]
    subtitle: Optional[str]
    purpose: Optional[str]
    author: Optional[str]
    publisher: Optional[str]
    isbn: Optional[str]
    language: Optional[str]
    publication_date: Optional[date]
    instructions: Optional[str]
    voice: Optional[str]


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
def get_project(request, project_id: int):
    """
    Retrieve a single project by its ID.
    """
    project = get_object_or_404(Project, id=project_id)
    return project


@router.put("/projects/{project_id}", response=ProjectOut)
def update_project(request, project_id: int, payload: ProjectUpdate):
    """
    Update the given fields on a project.
    """
    project = get_object_or_404(Project, id=project_id)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(project, field, value)
    project.save()
    return project


@router.delete("/projects/{project_id}")
def delete_project(request, project_id: int):
    """
    Delete a project.
    """
    project = get_object_or_404(Project, id=project_id)
    project.delete()
    # Ninja will return 200 OK with empty body by default
    return
