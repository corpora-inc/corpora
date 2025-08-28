from datetime import datetime
from typing import List, Optional
from uuid import UUID

from django.db import transaction
from django.shortcuts import get_object_or_404
from pydantic import BaseModel

from corpora_commander.models import (
    Project,
    ProjectSnapshot,
    Section,
    Subsection,
)

from .router import router


class SnapshotIn(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    snapshot: Optional[dict] = None


class SnapshotOut(BaseModel):
    id: UUID
    name: Optional[str]
    description: Optional[str]
    snapshot: dict
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/projects/{project_id}/snapshots", response=List[SnapshotOut])
def list_snapshots(request, project_id: UUID):
    project = get_object_or_404(Project, id=project_id)
    return project.snapshots.all()


@router.post("/projects/{project_id}/snapshots", response=SnapshotOut)
def create_snapshot(request, project_id: UUID, payload: SnapshotIn):
    project = get_object_or_404(Project, id=project_id)

    if payload.snapshot:
        snap_json = payload.snapshot
    else:
        snap_json = {
            "project": {
                "id": str(project.id),
                "title": project.title,
                "subtitle": project.subtitle,
                "purpose": project.purpose,
                "author": project.author,
                "publisher": project.publisher,
                "isbn": project.isbn,
                "language": project.language,
                "publication_date": project.publication_date.isoformat()
                if project.publication_date
                else None,
                "instructions": project.instructions,
                "voice": project.voice,
                "has_images": project.has_images,
            },
            "sections": [],
        }
        for sec in project.sections.all():
            sec_obj = {
                "id": str(sec.id),
                "order": sec.order,
                "title": sec.title,
                "introduction": sec.introduction,
                "instructions": sec.instructions,
                "subsections": [],
            }
            for sub in sec.subsections.all():
                sec_obj["subsections"].append(
                    {
                        "id": str(sub.id),
                        "order": sub.order,
                        "title": sub.title,
                        "content": sub.content,
                        "instructions": sub.instructions,
                    },
                )
            snap_json["sections"].append(sec_obj)

    ps = ProjectSnapshot.objects.create(
        project=project,
        name=payload.name or f"Snapshot @ {datetime.utcnow().isoformat()}",
        description=payload.description or "",
        snapshot=snap_json,
    )
    return ps


@router.get("/snapshots/{snapshot_id}", response=SnapshotOut)
def get_snapshot(request, snapshot_id: UUID):
    return get_object_or_404(ProjectSnapshot, id=snapshot_id)


@router.delete("/snapshots/{snapshot_id}")
def delete_snapshot(request, snapshot_id: UUID):
    snap = get_object_or_404(ProjectSnapshot, id=snapshot_id)
    snap.delete()
    return


@router.post("/snapshots/{snapshot_id}/restore", response=SnapshotOut)
def restore_snapshot(request, snapshot_id: UUID):
    snap = get_object_or_404(ProjectSnapshot, id=snapshot_id)
    data = snap.snapshot
    project = get_object_or_404(Project, id=snap.project_id)

    # create a pre-restore snapshot
    pre_snap = {
        "project": {
            "id": str(project.id),
            "title": project.title,
            "subtitle": project.subtitle,
            "purpose": project.purpose,
            "author": project.author,
            "publisher": project.publisher,
            "isbn": project.isbn,
            "language": project.language,
            "publication_date": project.publication_date.isoformat()
            if project.publication_date
            else None,
            "instructions": project.instructions,
            "voice": project.voice,
            "has_images": project.has_images,
        },
        "sections": [],
    }
    for sec in project.sections.all():
        ssec = {
            "id": str(sec.id),
            "order": sec.order,
            "title": sec.title,
            "introduction": sec.introduction,
            "instructions": sec.instructions,
            "subsections": [],
        }
        for sub in sec.subsections.all():
            ssec["subsections"].append(
                {
                    "id": str(sub.id),
                    "order": sub.order,
                    "title": sub.title,
                    "content": sub.content,
                    "instructions": sub.instructions,
                },
            )
        pre_snap["sections"].append(ssec)

    ProjectSnapshot.objects.create(
        project=project,
        name=f"Pre-restore {datetime.utcnow().isoformat()}",
        snapshot=pre_snap,
    )

    with transaction.atomic():
        proj_data = data["project"]
        for field in (
            "title",
            "subtitle",
            "purpose",
            "author",
            "publisher",
            "isbn",
            "language",
            "publication_date",
            "instructions",
            "voice",
            "has_images",
        ):
            if field in proj_data:
                setattr(project, field, proj_data[field])
        project.save()

        # delete existing sections/subsections and recreate
        project.sections.all().delete()

        for sec_obj in data.get("sections", []):
            sec = Section.objects.create(
                project=project,
                order=sec_obj.get("order", 0),
                title=sec_obj.get("title", ""),
                introduction=sec_obj.get("introduction", ""),
                instructions=sec_obj.get("instructions", ""),
            )
            for sub_obj in sec_obj.get("subsections", []):
                Subsection.objects.create(
                    section=sec,
                    order=sub_obj.get("order", 0),
                    title=sub_obj.get("title", ""),
                    content=sub_obj.get("content", ""),
                    instructions=sub_obj.get("instructions", ""),
                )

    return snap
