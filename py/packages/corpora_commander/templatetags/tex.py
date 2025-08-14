from django import template
from django.utils.safestring import mark_safe

register = template.Library()

# Mapping of special LaTeX characters to their escaped forms
_LATEX_ESCAPES = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}


@register.filter(name="latex_escape")
def latex_escape(value: str) -> str:
    """Escape LaTeX special characters in plain text.

    This is intended for inserting user/content strings into raw TeX templates
    (e.g., custom_cover.tex). It should NOT be used on Markdown that Pandoc will
    convert to LaTeX, as Pandoc already escapes appropriately.
    """
    if value is None:
        return ""
    s = str(value)
    # Important: escape backslash first to avoid double-escaping later
    s = s.replace("\\", _LATEX_ESCAPES["\\"])  # backslash
    for ch, esc in _LATEX_ESCAPES.items():
        if ch == "\\":
            continue
        s = s.replace(ch, esc)
    return mark_safe(s)
