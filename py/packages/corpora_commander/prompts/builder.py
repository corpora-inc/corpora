from __future__ import annotations

from typing import List

from corpora_ai.llm_interface import ChatCompletionTextMessage

from corpora_commander.models import Project, Section, Subsection

# ── Global constants ────────────────────────────────────────────
ROLE_AUTHOR = """
Role: You are an expert book author and editor.
""".strip()

ROLE_EDITOR = """
Role: You are an expert book editor. Preserve meaning, improve style.
""".strip()

ROLE_OUTLINER = """
Role: You are an expert book outliner.
""".strip()

MARKDOWN_RULES = """
# Markdown Rules
- Use CommonMark. Do **not** include raw HTML tags.
- Section introductions contain **no** markdown headers.
- Each subsection body **must** start with a level‑2 header: `## {title}`.
- Separate logical blocks with blank lines.
""".strip()

JSON_RULES = """
# JSON Output Rules
- Return strictly valid JSON matching the provided schema.
- Do **not** wrap JSON in Markdown fences.
- Do **not** add extra keys or metadata.
""".strip()

IMAGE_TOKEN_RULES = """
# Image Token Syntax

Insert an image placeholder where it truly enhances comprehension:

{{IMAGE: <caption>}}

- Appears alone on its own line with blank lines before and after.
- `<caption>` is a concise description of the imagined illustration.
- Do **not** use Markdown image syntax (`![]()`).
""".strip()

# ── Internal helpers ────────────────────────────────────────────


def _system_text(role: str, project: Project) -> str:
    parts = [role, MARKDOWN_RULES, JSON_RULES]
    if project.has_images:
        parts.append(IMAGE_TOKEN_RULES)
    return "\n\n".join(parts)


def _project_header(project: Project) -> List[str]:
    lines: List[str] = [f"Project Title: {project.title}"]
    if project.subtitle:
        lines.append(f"Project Subtitle: {project.subtitle}")
    if project.purpose:
        lines.append(f"Project Purpose: {project.purpose}")
    if project.voice:
        lines.append(f"Project Voice: {project.voice}")
    if project.instructions:
        lines.append(f"Project Instructions: {project.instructions}")
    return lines


# ── Draft (author) user text ────────────────────────────────────


def _draft_user_text(
    project: Project,
    section: Section,
    user_prompt: str,
    schema_json: str,
) -> str:
    lines = _project_header(project)
    lines += [
        "",
        f"Section Title: {section.title}",
        f"Section ID: {section.id}",
    ]
    if section.instructions:
        lines.append(f"Section Instructions: {section.instructions}")
    lines.append("")
    for sub in section.subsections.all().order_by("order"):
        lines += [
            f"Subsection Title: {sub.title}",
            f"Subsection ID: {sub.id}",
        ]
        if sub.instructions:
            lines.append(f"Subsection Instructions: {sub.instructions}")
        lines.append("")
    lines += [
        f"Prompt: {user_prompt}",
        "",
        "Return a JSON object matching this schema exactly:",
        schema_json,
    ]
    return "\n".join(lines)


# ── Rewrite (editor) user texts ─────────────────────────────────


def _rewrite_section_user_text(
    project: Project,
    section: Section,
    user_prompt: str,
    schema_json: str,
) -> str:
    lines = _project_header(project) + [
        "",
        f"Section Title: {section.title}",
        f"Section ID: {section.id}",
    ]
    if section.instructions:
        lines.append(f"Section Instructions: {section.instructions}")

    lines.append("")
    lines.append("Subsections:")
    for sub in section.subsections.all().order_by("order"):
        # just append the titles
        lines.append(f"- {sub.title}")

    lines.append("")
    if section.introduction:
        lines.append(f"Original Introduction: {section.introduction}")

    lines += [
        "",
        f"Prompt: {user_prompt}",
        "",
        "Return a JSON object matching this schema exactly:",
        schema_json,
    ]
    return "\n".join(lines)


def _rewrite_sub_user_text(
    project: Project,
    section: Section,
    sub: Subsection,
    user_prompt: str,
    schema_json: str,
) -> str:
    lines = _project_header(project) + [
        "",
        f"Section Title: {section.title}",
        f"Subsection ID: {sub.id}",
        f"Subsection Title: {sub.title}",
    ]
    if sub.instructions:
        lines.append(f"Instructions: {sub.instructions}")
    lines.append(f"Original Content: {sub.content}")
    lines += [
        "",
        f"Prompt: {user_prompt}",
        "",
        "Return a JSON object matching this schema exactly:",
        schema_json,
    ]
    return "\n".join(lines)


# ── Outline user text ─────────────────────────────────────────--


def _outline_user_text(
    project: Project,
    user_prompt: str,
    schema_json: str,
) -> str:
    lines = _project_header(project) + [
        "",
        f"Prompt: {user_prompt}",
        "",
        "Return a JSON object matching this schema exactly:",
        schema_json,
    ]
    return "\n".join(lines)


# ── Public builders ─────────────────────────────────────────────


def build_draft_messages(
    project: Project,
    section: Section,
    user_prompt: str,
    schema_json: str,
) -> List[ChatCompletionTextMessage]:
    return [
        ChatCompletionTextMessage("system", _system_text(ROLE_AUTHOR, project)),
        ChatCompletionTextMessage(
            "user",
            _draft_user_text(project, section, user_prompt, schema_json),
        ),
    ]


def build_rewrite_section_messages(
    project: Project,
    section: Section,
    user_prompt: str,
    schema_json: str,
) -> List[ChatCompletionTextMessage]:
    return [
        ChatCompletionTextMessage("system", _system_text(ROLE_EDITOR, project)),
        ChatCompletionTextMessage(
            "user",
            _rewrite_section_user_text(
                project,
                section,
                user_prompt,
                schema_json,
            ),
        ),
    ]


def build_rewrite_subsection_messages(
    project: Project,
    section: Section,
    sub: Subsection,
    user_prompt: str,
    schema_json: str,
) -> List[ChatCompletionTextMessage]:
    return [
        ChatCompletionTextMessage("system", _system_text(ROLE_EDITOR, project)),
        ChatCompletionTextMessage(
            "user",
            _rewrite_sub_user_text(
                project,
                section,
                sub,
                user_prompt,
                schema_json,
            ),
        ),
    ]


def build_outline_messages(
    project: Project,
    user_prompt: str,
    schema_json: str,
) -> List[ChatCompletionTextMessage]:
    return [
        ChatCompletionTextMessage(
            "system",
            _system_text(ROLE_OUTLINER, project),
        ),
        ChatCompletionTextMessage(
            "user",
            _outline_user_text(project, user_prompt, schema_json),
        ),
    ]
