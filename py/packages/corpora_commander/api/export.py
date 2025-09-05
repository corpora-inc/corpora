# packages/corpora_commander/api/export.py

import logging
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from uuid import UUID

from django.core.files.storage import default_storage
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils.text import get_valid_filename

from corpora_commander.models import Project

from .router import router

logger = logging.getLogger(__name__)


@router.get("/projects/{project_id}/export/pdf")
def export_pdf(request, project_id: UUID):
    # 1) Load project and render the Markdown
    proj = get_object_or_404(
        Project.objects.prefetch_related("sections__subsections"),
        id=project_id,
    )
    md_content = render_to_string("book.md", {"project": proj})

    # 2) Prepare a build directory
    build_dir = Path(tempfile.mkdtemp(prefix="corpora-export-"))
    md_file = build_dir / "book.md"
    images_dir = build_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    # 2a) Replace {{IMAGE: caption}} tokens with actual Markdown image links
    #     and copy the files into the build_dir so Pandoc can find them.
    token_re = re.compile(r"\{\{IMAGE:\s*(.+?)\s*\}\}")
    # Build a quick map of caption -> ProjectImage
    img_map = {img.caption: img for img in proj.images.all()}

    def _md_escape_alt(text: str) -> str:
        # Escape characters that can break Markdown image alt text
        # Pandoc should escape for LaTeX, but '&' in captions sometimes slips into \caption
        return (
            text.replace("\\", r"\\")
            .replace("[", r"\[")
            .replace("]", r"\]")
            .replace("(", r"\(")
            .replace(")", r"\)")
            .replace("&", "&amp;")
        )

    def _replace_token(m: re.Match) -> str:
        caption = m.group(1)
        img = img_map.get(caption)
        if not img:
            # Leave an obvious placeholder so the author can spot it
            return f"**[Missing image: {caption}]**"
        # Copy the image from storage (local or S3) into images_dir
        src_name = Path(img.image.name).name
        safe_name = get_valid_filename(src_name)
        dest_path = images_dir / safe_name
        # Avoid duplicate copies if multiple references exist
        if not dest_path.exists():
            with (
                default_storage.open(img.image.name, "rb") as src,
                open(
                    dest_path,
                    "wb",
                ) as dst,
            ):
                shutil.copyfileobj(src, dst)
        # Return a relative Markdown image link that Pandoc can resolve
        alt = _md_escape_alt(caption)
        return f"![{alt}](images/{safe_name})"

    md_content = token_re.sub(_replace_token, md_content)

    md_file.write_text(md_content, encoding="utf-8")

    # # write the md to disk for debugging:
    with open("debug_book.md", "w", encoding="utf-8") as f:
        f.write(md_content)

    # 3) Render custom headings (TeX) and cover (TeX)
    (build_dir / "custom_headings.tex").write_text(
        render_to_string("custom_headings.tex", {}),
        encoding="utf-8",
    )
    cover_ctx = {
        "title": proj.title,
        "subtitle": getattr(proj, "subtitle", ""),
        "author": getattr(proj, "author", None) or "The Encorpora Team",
        "publisher": getattr(proj, "publisher", None) or "Corpora Inc",
        # TODO: add setting/config for this.
        # "show_cover": True,
        "show_cover": False,
    }
    (build_dir / "custom_cover.tex").write_text(
        render_to_string("custom_cover.tex", cover_ctx),
        encoding="utf-8",
    )

    # 4) Render your one-and-only 6×9 defaults file via Django templates
    defaults_content = render_to_string("pandoc/6x9.yaml", {})
    defaults_file = build_dir / "defaults.yaml"
    defaults_file.write_text(defaults_content, encoding="utf-8")

    # 5) Run pandoc with --defaults
    pdf_file = build_dir / f"{proj.id}.pdf"
    pandoc_bin = shutil.which("pandoc") or "pandoc"
    logger.info("Running pandoc --defaults %s", defaults_file)
    try:
        completed = subprocess.run(
            [
                pandoc_bin,
                md_file.name,
                "--defaults",
                defaults_file.name,
                "-o",
                pdf_file.name,
            ],
            check=True,
            cwd=build_dir,
            capture_output=True,
            text=True,
        )
        logger.debug("pandoc stdout: %s", completed.stdout)
        logger.debug("pandoc stderr: %s", completed.stderr)
    except subprocess.CalledProcessError as e:
        logger.error(
            "Pandoc failed (rc=%s)\nSTDOUT:\n%s\nSTDERR:\n%s",
            e.returncode,
            e.stdout,
            e.stderr,
        )
        raise

    # 6) Stream back the PDF
    return FileResponse(
        open(pdf_file, "rb"),
        as_attachment=True,
        filename=f"{proj.title}.pdf",
        content_type="application/pdf",
    )
