# packages/corpora_commander/api/export.py

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


@router.get("/projects/{project_id}/export/pdf")
def export_pdf(request, project_id: UUID):
    """
    Export the entire book for a project as a PDF.
    Any unexpected error will propagate as a 500.
    """
    # 1) Load project + its sections/subsections
    proj = get_object_or_404(
        Project.objects.prefetch_related("sections__subsections"),
        id=project_id,
    )

    # 2) Render Markdown via our template
    md_content = render_to_string("book.md", {"project": proj})

    # 3) Write markdown & header to a temp build dir
    build_dir = Path(tempfile.mkdtemp(prefix="corpora-export-"))
    (build_dir / "book.md").write_text(md_content, encoding="utf-8")

    # copy custom header
    header_tex = render_to_string("custom_headings.tex", {})
    (build_dir / "custom_headings.tex").write_text(header_tex, encoding="utf-8")

    # 4) Find pandoc
    pandoc = shutil.which("pandoc")
    if not pandoc:
        raise RuntimeError("pandoc not found in PATH")

    # 5) Run pandoc → xelatex
    pdf_name = f"{proj.id}.pdf"
    cmd = [
        pandoc,
        "book.md",
        "-o",
        pdf_name,
        "--pdf-engine=xelatex",
        "--toc",
        "--toc-depth=2",
        "--include-in-header=custom_headings.tex",
    ]
    subprocess.run(cmd, check=True, cwd=build_dir)

    # 6) Stream back
    handle = open(build_dir / pdf_name, "rb")
    return FileResponse(
        handle,
        as_attachment=True,
        filename=f"{proj.title}.pdf",
        content_type="application/pdf",
    )
