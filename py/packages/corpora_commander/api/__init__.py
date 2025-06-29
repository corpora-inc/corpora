# Side-effect imports to attach routes

from .router import router as commander_router  # noqa

from . import (  # noqa
    onboarding,
    project,
    llm,
    section,
    subsection,
    outline,
    draft,
    export,
    rewrite,
)
