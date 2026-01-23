# corpora_commander/api/project.py

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import List, Optional
from uuid import UUID

from django.shortcuts import get_object_or_404
from pydantic import BaseModel, field_validator

from corpora_commander.models import Project

from .router import router

BOOK_SIZES = {size for size, _label in Project.BOOK_SIZE_CHOICES}
MIN_FONT_SIZE = Decimal("8.0")
MAX_FONT_SIZE = Decimal("18.0")


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
    book_size: Optional[str] = "6x9"
    font_size: Optional[Decimal] = Decimal("11.0")

    @field_validator("book_size")
    @classmethod
    def _validate_book_size(cls, v):
        if v is None:
            return v
        if v not in BOOK_SIZES:
            raise ValueError(f"Invalid book_size: {v}")
        return v

    @field_validator("font_size", mode="before")
    @classmethod
    def _validate_font_size(cls, v):
        if v is None or v == "":
            return None
        try:
            size = Decimal(str(v))
        except (InvalidOperation, ValueError) as exc:
            raise ValueError(f"Invalid font_size: {v}") from exc
        if size < MIN_FONT_SIZE or size > MAX_FONT_SIZE:
            raise ValueError(
                f"font_size must be between {MIN_FONT_SIZE} and {MAX_FONT_SIZE}",
            )
        return size


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
    book_size: Optional[str] = None
    font_size: Optional[Decimal] = None

    model_config = {"from_attributes": True}

    @field_validator("publication_date", mode="before")
    @classmethod
    def _empty_to_none(cls, v):
        # turn empty‐string or all‐whitespace into None
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @field_validator("book_size")
    @classmethod
    def _validate_book_size(cls, v):
        if v is None:
            return v
        if v not in BOOK_SIZES:
            raise ValueError(f"Invalid book_size: {v}")
        return v

    @field_validator("font_size", mode="before")
    @classmethod
    def _validate_font_size(cls, v):
        if v is None or v == "":
            return None
        try:
            size = Decimal(str(v))
        except (InvalidOperation, ValueError) as exc:
            raise ValueError(f"Invalid font_size: {v}") from exc
        if size < MIN_FONT_SIZE or size > MAX_FONT_SIZE:
            raise ValueError(
                f"font_size must be between {MIN_FONT_SIZE} and {MAX_FONT_SIZE}",
            )
        return size


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
