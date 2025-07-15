import re
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from django.shortcuts import get_object_or_404
from ninja import File, Form, UploadedFile
from pydantic import BaseModel

from corpora_commander.models import Project, ProjectImage

from .router import router


class ProjectImageOut(BaseModel):
    id: UUID
    caption: str
    image: str  # URL or path to the image file
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ProjectImageUpdate(BaseModel):
    caption: Optional[str] = None

    class Config:
        from_attributes = True


class ImageToken(BaseModel):
    caption: str
    fulfilled: bool
    image_id: Optional[UUID] = None

    class Config:
        from_attributes = True


@router.get("/projects/{project_id}/images/", response=List[ProjectImageOut])
def list_images(request, project_id: UUID):
    project = get_object_or_404(Project, id=project_id)
    return project.images.order_by("uploaded_at").all()


@router.post("/projects/{project_id}/images/", response=ProjectImageOut)
def create_image(
    request,
    project_id: UUID,
    caption: str = Form(...),
    image: UploadedFile = File(...),
):
    project = get_object_or_404(Project, id=project_id)
    img = ProjectImage.objects.create(
        project=project,
        caption=caption,
        image=image,
    )
    return img


@router.get(
    "/projects/{project_id}/images/{image_id}",
    response=ProjectImageOut,
)
def get_image(request, project_id: UUID, image_id: UUID):
    get_object_or_404(Project, id=project_id)
    return get_object_or_404(ProjectImage, id=image_id, project_id=project_id)


@router.patch(
    "/projects/{project_id}/images/{image_id}",
    response=ProjectImageOut,
)
def update_image(
    request,
    project_id: UUID,
    image_id: UUID,
    payload: ProjectImageUpdate,
):
    get_object_or_404(Project, id=project_id)
    img = get_object_or_404(ProjectImage, id=image_id, project_id=project_id)
    data = payload.model_dump(exclude_unset=True)
    if "caption" in data:
        img.caption = data["caption"]
        img.save()
    return img


@router.delete("/projects/{project_id}/images/{image_id}")
def delete_image(request, project_id: UUID, image_id: UUID):
    get_object_or_404(Project, id=project_id)
    img = get_object_or_404(ProjectImage, id=image_id, project_id=project_id)
    img.delete()
    return


@router.get("/projects/{project_id}/image-tokens/", response=List[ImageToken])
def list_image_tokens(request, project_id: UUID):
    project = get_object_or_404(Project, id=project_id)

    pattern = re.compile(r"\{\{IMAGE:\s*(.+?)\s*\}\}")
    captions = []
    # Scan only actual book content: section.introduction and subsection.content
    for section in project.sections.all():
        if section.introduction:
            captions += pattern.findall(section.introduction)
        for subsection in section.subsections.all():
            if subsection.content:
                captions += pattern.findall(subsection.content)

    # dedupe preserving order
    seen = set()
    unique_caps = []
    for cap in captions:
        if cap not in seen:
            seen.add(cap)
            unique_caps.append(cap)

    images_map = {img.caption: img.id for img in project.images.all()}

    tokens = [
        ImageToken(
            caption=cap,
            fulfilled=(cap in images_map),
            image_id=images_map.get(cap),
        )
        for cap in unique_caps
    ]

    return tokens
