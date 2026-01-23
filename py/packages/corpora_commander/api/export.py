# packages/corpora_commander/api/export.py

import logging
import re
import shutil
import subprocess
import tempfile
from datetime import date
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from django.core.files.storage import default_storage
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils.text import get_valid_filename

from corpora_commander.models import Project

from .router import router

logger = logging.getLogger(__name__)
PANDOC_TIMEOUT_SECONDS = 180

BOOK_SIZE_DIMENSIONS = {
    "5x8": ("5in", "8in"),
    "5.25x8": ("5.25in", "8in"),
    "5.5x8.5": ("5.5in", "8.5in"),
    "6x9": ("6in", "9in"),
    "8.5x11": ("8.5in", "11in"),
}

BOOK_SIZE_MARGINS = {
    "5x8": {
        "left": "0.6in",
        "right": "0.6in",
        "top": "0.5in",
        "bottom": "0.85in",
    },
    "5.25x8": {
        "left": "0.62in",
        "right": "0.62in",
        "top": "0.55in",
        "bottom": "0.9in",
    },
    "5.5x8.5": {
        "left": "0.65in",
        "right": "0.65in",
        "top": "0.6in",
        "bottom": "0.95in",
    },
    "6x9": {
        "left": "0.75in",
        "right": "0.75in",
        "top": "0.6in",
        "bottom": "1.0in",
    },
    "8.5x11": {
        "left": "1.0in",
        "right": "1.0in",
        "top": "0.9in",
        "bottom": "1.2in",
    },
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
    size_key = proj.book_size or "6x9"
    paperwidth, paperheight = BOOK_SIZE_DIMENSIONS.get(
        size_key,
        BOOK_SIZE_DIMENSIONS["6x9"],
    )
    margins = BOOK_SIZE_MARGINS.get(size_key, BOOK_SIZE_MARGINS["6x9"])
    font_size = Decimal(proj.font_size or "11.0")
    line_height = (font_size * Decimal("1.2")).quantize(Decimal("0.01"))
    (build_dir / "custom_headings.tex").write_text(
        render_to_string(
            "custom_headings.tex",
            {
                "paperwidth": paperwidth,
                "paperheight": paperheight,
                "margin_left": margins["left"],
                "margin_right": margins["right"],
                "margin_top": margins["top"],
                "margin_bottom": margins["bottom"],
                "font_size": f"{font_size}pt",
                "line_height": f"{line_height}pt",
            },
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
        {
            "paperwidth": paperwidth,
            "paperheight": paperheight,
        },
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
            timeout=PANDOC_TIMEOUT_SECONDS,
        )
        logger.debug("pandoc stdout: %s", completed.stdout)
        logger.debug("pandoc stderr: %s", completed.stderr)
    except subprocess.TimeoutExpired:
        logger.error("Pandoc timed out after %ss", PANDOC_TIMEOUT_SECONDS)
        shutil.rmtree(build_dir, ignore_errors=True)
        return HttpResponse(
            "PDF export timed out. Try again or reduce project size.",
            status=504,
            content_type="text/plain",
        )
    except subprocess.CalledProcessError as e:
        logger.error(
            "Pandoc failed (rc=%s)\nSTDOUT:\n%s\nSTDERR:\n%s",
            e.returncode,
            e.stdout,
            e.stderr,
        )
        shutil.rmtree(build_dir, ignore_errors=True)
        return HttpResponse(
            "PDF export failed. Check server logs for details.",
            status=500,
            content_type="text/plain",
        )
    if not pdf_file.exists() or pdf_file.stat().st_size == 0:
        logger.error("Pandoc produced an empty PDF.")
        shutil.rmtree(build_dir, ignore_errors=True)
        return HttpResponse(
            "PDF export produced an empty file. Try again.",
            status=500,
            content_type="text/plain",
        )

    # 6) Return the PDF (buffered to avoid async streaming warnings)
    filename = f"{get_valid_filename(proj.title) or proj.id}.pdf"
    pdf_bytes = pdf_file.read_bytes()
    shutil.rmtree(build_dir, ignore_errors=True)
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response["Content-Length"] = str(len(pdf_bytes))
    return response


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
