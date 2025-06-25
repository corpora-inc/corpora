import logging
import shutil
import subprocess
import tempfile
from pathlib import Path
from uuid import UUID

from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string

from corpora_commander.models import Project

from .router import router

logger = logging.getLogger(__name__)


@router.get("/projects/{project_id}/export/pdf")
def export_pdf(request, project_id: UUID):
    """
    Export the entire book for a project as a PDF.
    """
    # 1) Load project and its sections/subsections
    proj = get_object_or_404(
        Project.objects.prefetch_related("sections__subsections"),
        id=project_id,
    )

    # 2) Render the markdown from our template
    md_content = render_to_string("book.md", {"project": proj})

    # 3) Write markdown to a temporary build directory
    build_dir = Path(tempfile.mkdtemp(prefix="corpora-export-"))
    md_file = build_dir / "book.md"
    md_file.write_text(md_content, encoding="utf-8")

    pdf_file = build_dir / f"{proj.id}.pdf"

    # 4) Locate pandoc executable
    pandoc_path = shutil.which("pandoc")
    if not pandoc_path:
        logger.error("Pandoc not found in PATH; cannot export PDF")
        raise Http404(
            "PDF export is not available. Pandoc is not installed on the server.",
        )

    # 5) Invoke pandoc to generate the PDF
    cmd = [
        pandoc_path,
        str(md_file),
        "-o",
        str(pdf_file),
        "--pdf-engine=xelatex",
        "--toc",
        "--toc-depth=2",
    ]
    logger.info("Running pandoc for project %s: %s", proj.id, " ".join(cmd))
    try:
        subprocess.run(cmd, check=True, cwd=build_dir)
    except subprocess.CalledProcessError as e:
        logger.error("Pandoc failed: %s", e)
        raise Http404("Failed to generate PDF.")

    # 6) Stream the resulting PDF back to the client
    pdf_handle = open(pdf_file, "rb")
    return FileResponse(
        pdf_handle,
        as_attachment=True,
        filename=f"{proj.title}.pdf",
        content_type="application/pdf",
    )
