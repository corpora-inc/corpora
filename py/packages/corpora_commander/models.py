import uuid

from django.db import models


# TODO: cloud storage?
def project_image_upload_to(instance, filename):
    """
    Store images under MEDIA_ROOT/projects/<project_uuid>/filename
    """
    return f"uploads/{instance.project.id}/{filename}"


class Project(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=500, blank=True)
    purpose = models.TextField(blank=True)
    author = models.CharField(max_length=200, blank=True)
    publisher = models.CharField(max_length=200, blank=True)
    isbn = models.CharField(max_length=32, blank=True)
    language = models.CharField(max_length=10, default="en-US")
    publication_date = models.DateField(null=True, blank=True)

    # NEW: do we include images?
    has_images = models.BooleanField(
        default=False,
        help_text="Whether this project will include images",
    )

    # LLM guidance fields
    instructions = models.TextField(
        blank=True,
        help_text="System-level prompt to guide the LLM (tone, style, etc.)",
    )
    voice = models.TextField(
        blank=True,
        help_text='Narrative voice (e.g. "academic", "conversational")',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Section(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        "Project",
        related_name="sections",
        on_delete=models.CASCADE,
    )
    order = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=200)
    introduction = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]
        unique_together = ("project", "order")

    def __str__(self):
        return self.title


class Subsection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.ForeignKey(
        "Section",
        related_name="subsections",
        on_delete=models.CASCADE,
    )
    order = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["section__order", "order"]
        unique_together = ("section", "order")

    def __str__(self):
        return self.title


class ProjectImage(models.Model):
    """
    Images belonging to a Project, matching markdown tokens {{IMAGE: caption}}
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        related_name="images",
        on_delete=models.CASCADE,
    )
    image = models.ImageField(
        upload_to=project_image_upload_to,
        help_text="Image file to fulfill markdown placeholder caption",
    )
    caption = models.CharField(
        max_length=1000,
        help_text="Exact text matching the {{IMAGE: caption}} token",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    # width = models.PositiveIntegerField(null=True, blank=True, editable=False)
    # height = models.PositiveIntegerField(null=True, blank=True, editable=False)

    class Meta:
        unique_together = ("project", "caption")
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"{self.project.title} - {self.caption}"
