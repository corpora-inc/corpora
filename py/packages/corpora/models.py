from __future__ import annotations

import logging
import os
import uuid
from typing import TYPE_CHECKING

from corpora_ai.split import get_text_splitter
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from pgvector.django import CosineDistance, VectorField

if TYPE_CHECKING:
    from corpora_ai.llm_interface import LLMBaseInterface
    from django.db.models.manager import BaseManager


# TODO: This loads too early and makes it hard to mock
# from corpora_ai.provider_loader import load_llm_provider

User = get_user_model()

logger = logging.getLogger(__name__)


class Corpus(models.Model):
    """Represents a unique corpus, often corresponding to a specific repository
    or collection of documents. A corpus can have an associated URL for
    tracking its origin, such as a GitHub repository.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="corpora",
        help_text="User who owns the corpus.",
    )
    url = models.URLField(
        blank=True,
        default="",
        help_text="Optional URL associated with the corpus, e.g., a GitHub repository.",
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        editable=False,
        help_text="Timestamp indicating when the corpus was created.",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp indicating the last update of the corpus.",
    )

    class Meta:
        unique_together = ("name", "owner")
        verbose_name_plural = "corpora"

    def __str__(self):
        return self.name

    def get_relevant_splits(
        self,
        text: str,
        limit: int = 10,
    ) -> BaseManager["Split"]:
        """Given a text query, return the most relevant splits from this corpus."""
        from corpora_ai.provider_loader import load_llm_provider

        llm: LLMBaseInterface = load_llm_provider("openai")
        vector = llm.get_embedding(text)
        return (
            Split.objects.filter(
                vector__isnull=False,
                file__corpus_id=self.id,
            )
            .annotate(similarity=CosineDistance("vector", vector))
            .order_by("similarity")[:limit]
        )

    def get_relevant_splits_context(self, text: str, limit: int = 5) -> str:
        """Given a text query, return the most relevant splits from this corpus
        along with the context of the split.
        """
        splits = self.get_relevant_splits(text, limit)
        split_context = ""
        for split in splits:
            split_context += (
                f"\n\n{split.file.path}:\n```\n{split.content}\n```\n\n"
            )
        return split_context

    def get_file_hashes(self) -> dict:
        """Retrieve a map of file paths to their hashes for this Corpus."""
        # TODO: types?
        return {file.path: file.checksum for file in self.files.all()}

    def delete_files(self, files: list) -> None:
        """Delete files from this Corpus by path."""
        self.files.filter(path__in=files).delete()


class CorpusTextFile(models.Model):
    """A file with UTF-8 text content associated with a Corpus."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    corpus = models.ForeignKey(
        Corpus,
        on_delete=models.CASCADE,
        related_name="files",
    )
    path = models.CharField(max_length=1024)
    content = models.TextField(blank=True)
    ai_summary = models.TextField(blank=True)
    vector_of_summary = VectorField(
        dimensions=1536,
        null=True,
        blank=True,
        help_text="text-embedding-3-small vector of the content",
        editable=False,
    )
    checksum = models.CharField(
        max_length=40,
        editable=False,
        help_text="SHA1 checksum of the file content as in `git hash-object`",
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("corpus", "path")
        ordering = ["path"]

    def __str__(self):
        return f"{self.corpus.name}:{self.path}"

    def get_and_save_summary(self):
        from corpora_ai.provider_loader import load_llm_provider

        llm = load_llm_provider()
        summary = llm.get_summary(self._get_text_representation())
        self.ai_summary = summary
        self.save(update_fields=["ai_summary"])

    def _get_text_representation(self):
        return f"{self.corpus.name}:{self.path}\n\n{self.content}"

    def get_and_save_vector_of_summary(self):
        from corpora_ai.provider_loader import load_llm_provider

        llm = load_llm_provider()
        vector = llm.get_embedding(self.ai_summary)
        self.vector_of_summary = vector
        self.save(update_fields=["vector_of_summary"])

    def split_content(self):
        """Splits the content of the file into smaller parts using an appropriate text splitter.
        Returns a list of Split instances.
        """
        file_name = os.path.basename(self.path)
        splitter = get_text_splitter(file_name)

        # Split content into parts
        parts = splitter.split_text(self.content)
        splits = []

        # Create Split instances for each part
        for order, part in enumerate(parts):
            split = Split.objects.create(file=self, order=order, content=part)
            splits.append(split)

        return splits


class Split(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(
        CorpusTextFile,
        on_delete=models.CASCADE,
        related_name="splits",
    )
    order = models.PositiveIntegerField()
    content = models.TextField(blank=True)
    vector = VectorField(
        dimensions=1536,
        null=True,
        blank=True,
        help_text="text-embedding-3-small vector of the content",
        editable=False,
    )
    # # Multivector: https://huggingface.co/colbert-ir/colbertv2.0
    # https://github.com/pgvector/pgvector/issues/640
    # https://docs.djangoproject.com/en/5.1/ref/contrib/postgres/fields/#arrayfield
    # colbert_embeddings = ArrayField(
    #     base_field=VectorField(dimensions=128),
    #     size=None,  # Set to None for variable-length arrays
    # )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ("file", "order")
        ordering = ["file", "order"]

    def __str__(self):
        return f"{self.file.corpus.name}:{self.file.path}:{self.order}"

    def get_and_save_vector(self):
        logger.info(
            f"{self.file.path}: {self.content[:10]} ... {self.content[-10:]}",
        )
        from corpora_ai.provider_loader import load_llm_provider

        llm = load_llm_provider()
        vector = llm.get_embedding(self.content)
        self.vector = vector
        self.save(update_fields=["vector"])

    # # Optionally, for multi-vector storage
    # def get_and_save_colbert_vectors(self):
    #     colbert_vectors = generate_colbert_vectors(self.content)  # e.g., a list of 128-dim vectors
    #     self.colbert_embeddings = colbert_vectors
    #     self.save(update_fields=["colbert_embeddings"])
