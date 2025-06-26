# packages/corpora_commander/api/export.py

import logging
import shutil
import subprocess
import tempfile
from pathlib import Path
from uuid import UUID

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string

from corpora_commander.models import Project

from .router import router

logger = logging.getLogger(__name__)


@router.get("/projects/{project_id}/export/pdf")
def export_pdf(request, project_id: UUID):
    proj = get_object_or_404(
        Project.objects.prefetch_related("sections__subsections"),
        id=project_id,
    )

    md_content = render_to_string("book.md", {"project": proj})

    build_dir = Path(tempfile.mkdtemp(prefix="corpora-export-"))
    md_file = build_dir / "book.md"
    md_file.write_text(md_content, encoding="utf-8")

    header_content = render_to_string("custom_headings.tex", {})
    (build_dir / "custom_headings.tex").write_text(
        header_content,
        encoding="utf-8",
    )

    pdf_file = build_dir / f"{proj.id}.pdf"

    pandoc_path = shutil.which("pandoc") or "pandoc"
    logger.info("Running pandoc: %s", pandoc_path)
    subprocess.run(
        [
            pandoc_path,
            md_file.name,
            "-o",
            pdf_file.name,
            "--pdf-engine=xelatex",
            "--toc",
            "--toc-depth=2",
            "--include-in-header=custom_headings.tex",
        ],
        check=True,
        cwd=build_dir,
    )

    return FileResponse(
        open(pdf_file, "rb"),
        as_attachment=True,
        filename=f"{proj.title}.pdf",
        content_type="application/pdf",
    )
