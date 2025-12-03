import logging
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile as DjangoUploadedFile
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils.text import get_valid_filename
from ninja import File, Form, UploadedFile
from pydantic import BaseModel, field_validator

try:
    from PIL import Image as PILImage  # noqa: F401
except ImportError:  # pragma: no cover
    PILImage = None  # type: ignore[assignment]

from corpora_commander.models import Project, ProjectImage

from .llm_utils import build_llm
from .router import router

logger = logging.getLogger(__name__)


class ProjectImageOut(BaseModel):
    id: UUID
    caption: str
    image: str  # URL or path to the image file
    uploaded_at: datetime

    class Config:
        from_attributes = True

    @field_validator("image", mode="before")
    @classmethod
    def _extract_image_url(cls, v):
        if hasattr(v, "url"):
            return v.url
        return str(v)


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


class GenerateProjectImageIn(BaseModel):
    provider: str
    config: Dict[str, Any]
    caption: str
    prompt: Optional[str] = None


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

    caption = caption.strip()
    if not caption:
        raise ValidationError("Caption is required")

    allowed_content_types = {
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/tiff",
        "image/bmp",
        "image/svg+xml",
    }

    if isinstance(image, DjangoUploadedFile):
        ctype = (image.content_type or "").lower()
        if ctype not in allowed_content_types:
            raise ValidationError(f"Unsupported image type: {ctype}")
        image.name = get_valid_filename(image.name)

    try:
        max_mb = float(os.environ.get("MAX_IMAGE_SIZE_MB", "15"))
    except ValueError:
        max_mb = 15.0
    max_bytes = int(max_mb * 1024 * 1024)

    size = getattr(image, "size", None)
    if size is not None and size > max_bytes:
        raise ValidationError(
            f"Image too large: {size} bytes (max {max_bytes} bytes)",
        )

    try:
        img = ProjectImage.objects.create(
            project=project,
            caption=caption,
            image=image,
        )
    except IntegrityError:
        raise ValidationError(
            "An image with this caption already exists for the project.",
        )

    return img


@router.post(
    "/projects/{project_id}/images/generate",
    response=ProjectImageOut,
)
def generate_project_image(
    request,
    project_id: UUID,
    payload: GenerateProjectImageIn,
):
    """
    Generate an image via the configured LLM/image provider and attach it
    to this project as a ProjectImage, keyed by caption.

    Designed to plug directly into the {{IMAGE: caption}} token system.
    """
    project = get_object_or_404(Project, id=project_id)

    caption = payload.caption.strip()
    if not caption:
        raise ValidationError("Caption is required")

    def maybe(label: str, value: Optional[str]) -> Optional[str]:
        if value:
            return f"{label}: {value}"
        return None

    prompt_lines = [
        # f"Book title: {project.title}",
        # maybe("Subtitle", getattr(project, "subtitle", None)),
        # maybe("Purpose", getattr(project, "purpose", None)),
        # maybe("Voice", getattr(project, "voice", None)),
        f"The caption for the image is: {caption}",
        maybe("Instructions", payload.prompt),
    ]
    image_prompt = "\n\n".join(line for line in prompt_lines if line)

    logger.info(
        "Generating project image for project=%s caption=%r provider=%s",
        project_id,
        caption,
        payload.provider,
    )

    llm = build_llm(payload.provider, payload.config)
    images = llm.get_image(image_prompt)
    img0 = images[0]

    fmt = (getattr(img0, "format", "") or "png").lower()
    if fmt not in {"png", "jpg", "jpeg", "webp"}:
        fmt = "png"

    data_bytes = bytes(img0.data)

    base_name = get_valid_filename(caption or "image")
    filename = f"{base_name}.{fmt}"
    django_file = ContentFile(data_bytes, name=filename)

    project_image, _created = ProjectImage.objects.update_or_create(
        project=project,
        caption=caption,
        defaults={"image": django_file},
    )
    return project_image


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
    captions: List[str] = []

    # Scan only actual book content: section.introduction and subsection.content
    for section in project.sections.all():
        if section.introduction:
            captions += pattern.findall(section.introduction)
        for subsection in section.subsections.all():
            if subsection.content:
                captions += pattern.findall(subsection.content)

    seen = set()
    unique_caps: List[str] = []
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
