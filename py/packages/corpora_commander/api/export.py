# packages/corpora_commander/api/export.py

import logging
import re
import shutil
import subprocess
import tempfile
from datetime import date
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

BOOK_SIZE_DIMENSIONS = {
    "5x8": ("5in", "8in"),
    "5.25x8": ("5.25in", "8in"),
    "5.5x8.5": ("5.5in", "8.5in"),
    "6x9": ("6in", "9in"),
    "8.5x11": ("8.5in", "11in"),
}


def _render_project_markdown_with_images(project: Project) -> tuple[Path, Path]:
    """
    Render the project's Markdown into a temporary build directory and
    materialize any {{IMAGE: caption}} tokens as real image files + links.

    Returns (build_dir, md_file_path).
    """
    # Base build dir & files
    build_dir = Path(tempfile.mkdtemp(prefix="corpora-export-"))
    md_file = build_dir / "book.md"
    images_dir = build_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    # Initial markdown from template
    md_content = render_to_string("book.md", {"project": project})

    # Replace {{IMAGE: caption}} tokens with Markdown image links,
    # copying actual image files into build_dir/images.
    token_re = re.compile(r"\{\{IMAGE:\s*(.+?)\s*\}\}")
    img_map = {img.caption: img for img in project.images.all()}

    def _md_escape_alt(text: str) -> str:
        # Escape characters that can break Markdown image alt text
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

        if not dest_path.exists():
            with (
                default_storage.open(img.image.name, "rb") as src,
                open(dest_path, "wb") as dst,
            ):
                shutil.copyfileobj(src, dst)

        alt = _md_escape_alt(caption)
        return f"![{alt}](images/{safe_name})"

    md_content = token_re.sub(_replace_token, md_content)

    # Write markdown into build dir
    md_file.write_text(md_content, encoding="utf-8")

    # Optional debug copy in project root (same as your original code)
    with open("debug_book.md", "w", encoding="utf-8") as f:
        f.write(md_content)

    return build_dir, md_file


@router.get("/projects/{project_id}/export/pdf")
def export_pdf(request, project_id: UUID):
    # 1) Load project
    proj = get_object_or_404(
        Project.objects.prefetch_related("sections__subsections", "images"),
        id=project_id,
    )

    # 2) Render markdown + images into a build dir
    build_dir, md_file = _render_project_markdown_with_images(proj)

    # 3) Render custom headings (TeX) and cover (TeX)
    paperwidth, paperheight = BOOK_SIZE_DIMENSIONS.get(
        proj.book_size or "6x9",
        BOOK_SIZE_DIMENSIONS["6x9"],
    )
    (build_dir / "custom_headings.tex").write_text(
        render_to_string(
            "custom_headings.tex",
            {"paperwidth": paperwidth, "paperheight": paperheight},
        ),
        encoding="utf-8",
    )
    cover_ctx = {
        "title": proj.title,
        "subtitle": getattr(proj, "subtitle", ""),
        "author": getattr(proj, "author", None) or "The Encorpora Team",
        "publisher": getattr(proj, "publisher", None) or "Corpora Inc",
        # TODO: add setting/config for this.
        "show_cover": False,
    }
    (build_dir / "custom_cover.tex").write_text(
        render_to_string("custom_cover.tex", cover_ctx),
        encoding="utf-8",
    )

    # 4) Render your one-and-only 6×9 defaults file via Django templates
    defaults_content = render_to_string(
        "pandoc/defaults.yaml",
        {"paperwidth": paperwidth, "paperheight": paperheight},
    )
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


@router.get("/projects/{project_id}/export/epub")
def export_epub(request, project_id: UUID):
    """
    Build and return an EPUB for the given project.

    Uses:
    - templates/book.md        → source markdown
    - templates/epub.css       → styling for the EPUB
    """
    # 1) Load project
    proj = get_object_or_404(
        Project.objects.prefetch_related("sections__subsections", "images"),
        id=project_id,
    )

    # 2) Render markdown + images into a build dir
    build_dir, md_file = _render_project_markdown_with_images(proj)

    # 3) Write EPUB CSS from a Django template (create templates/epub.css)
    (build_dir / "epub.css").write_text(
        render_to_string("epub.css", {}),
        encoding="utf-8",
    )

    # 4) Basic metadata for the EPUB
    meta = {
        "title": proj.title,
        "author": getattr(proj, "author", None) or "The Encorpora Team",
        "lang": getattr(proj, "language", None) or "en-US",
        "date": (
            proj.publication_date.isoformat()
            if getattr(proj, "publication_date", None)
            else date.today().isoformat()
        ),
        "publisher": getattr(proj, "publisher", None) or "Corpora Inc",
        "isbn": getattr(proj, "isbn", None) or "",
    }

    # 5) Run pandoc to produce EPUB
    epub_file = build_dir / f"{proj.id}.epub"
    pandoc_bin = shutil.which("pandoc") or "pandoc"

    # Base args
    args = [
        pandoc_bin,
        md_file.name,
        "-o",
        epub_file.name,
        "--to=epub3",
        "--mathml",
        "--css=epub.css",
        "--toc",
        "--toc-depth=2",
    ]

    # Add metadata flags (skip empty values)
    for key, value in meta.items():
        if value:
            args.append(f"--metadata={key}:{value}")

    logger.info("Running pandoc for EPUB: %s", " ".join(args))
    try:
        completed = subprocess.run(
            args,
            check=True,
            cwd=build_dir,
            capture_output=True,
            text=True,
        )
        logger.debug("pandoc (epub) stdout: %s", completed.stdout)
        logger.debug("pandoc (epub) stderr: %s", completed.stderr)
    except subprocess.CalledProcessError as e:
        logger.error(
            "Pandoc EPUB failed (rc=%s)\nSTDOUT:\n%s\nSTDERR:\n%s",
            e.returncode,
            e.stdout,
            e.stderr,
        )
        raise

    # 6) Stream back the EPUB
    return FileResponse(
        open(epub_file, "rb"),
        as_attachment=True,
        filename=f"{proj.title}.epub",
        content_type="application/epub+zip",
    )
