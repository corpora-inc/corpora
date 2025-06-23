# corpora_commander/admin.py

from django.contrib import admin

from .models import Project, Section, Subsection


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "author",
        "publisher",
        "publication_date",
        "created_at",
    )
    list_filter = (
        "publisher",
        "language",
        "publication_date",
    )
    search_fields = (
        "title",
        "subtitle",
        "purpose",
        "author",
        "publisher",
        "isbn",
    )
    date_hierarchy = "publication_date"
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    ordering = ("-created_at",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "title",
                    "subtitle",
                    "purpose",
                ),
            },
        ),
        (
            "Publication",
            {
                "fields": (
                    "author",
                    "publisher",
                    "isbn",
                    "language",
                    "publication_date",
                ),
            },
        ),
        (
            "LLM Guidance",
            {
                "fields": (
                    "instructions",
                    "voice",
                ),
                "description": "Optional prompts and voice settings for AI workflows",
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )


class SubsectionInline(admin.TabularInline):
    model = Subsection
    extra = 0
    fields = ("order", "title", "instructions")
    ordering = ("order",)


class SectionInline(admin.TabularInline):
    model = Section
    extra = 0
    fields = ("order", "title", "instructions")
    ordering = ("order",)


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "order", "created_at")
    list_filter = ("project",)
    ordering = ("project", "order")
    inlines = (SubsectionInline,)


@admin.register(Subsection)
class SubsectionAdmin(admin.ModelAdmin):
    list_display = ("title", "section", "order", "created_at")
    list_filter = ("section__project", "section")
    ordering = ("section__order", "order")
