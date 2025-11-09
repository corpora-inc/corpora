from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from corpora.models import Corpus, CorpusTextFile, Split

User = get_user_model()


@pytest.mark.django_db
def test_corpus_creation():
    """Test creating a Corpus instance."""
    user = User.objects.create(username="testuser", password="password123")
    corpus = Corpus.objects.create(
        name="Test Corpus",
        owner=user,
        url="https://example.com",
    )

    assert corpus.name == "Test Corpus"
    assert corpus.owner == user
    assert corpus.url == "https://example.com"
    assert corpus.created_at <= timezone.now()
    assert corpus.updated_at <= timezone.now()
    assert str(corpus) == "Test Corpus"


@patch("corpora_ai.provider_loader.load_llm_provider")
@pytest.mark.django_db
def test_get_relevant_splits(mock_llm_provider):
    """Test Corpus `get_relevant_splits` method."""
    # Mock the LLM provider to return a dummy embedding
    mock_llm_provider.return_value.get_embedding.return_value = [0.1] * 1536

    # Set up test data
    user = User.objects.create(username="testuser", password="password123")
    corpus = Corpus.objects.create(name="Test Corpus", owner=user)
    file = CorpusTextFile.objects.create(
        corpus=corpus,
        path="test.txt",
        content="Content of the file.",
    )
    split_1 = Split.objects.create(
        file=file,
        order=1,
        content="First split content",
        vector=[0.1] * 1536,
    )
    split_2 = Split.objects.create(
        file=file,
        order=2,
        content="Second split content",
        vector=[0.2] * 1536,
    )
    split_3 = Split.objects.create(
        file=file,
        order=3,
        content="Third split content",
        vector=[0.3] * 1536,
    )

    # Call the method
    relevant_splits = corpus.get_relevant_splits("query text", limit=2)

    # Assert the results
    assert len(relevant_splits) == 2
    assert split_1 in relevant_splits
    assert split_2 in relevant_splits
    assert split_3 not in relevant_splits

    # Verify the LLM provider was called with the query text
    mock_llm_provider.return_value.get_embedding.assert_called_once_with(
        "query text",
    )


@pytest.mark.django_db
def test_corpus_text_file_creation():
    """Test creating a CorpusTextFile instance."""
    user = User.objects.create(username="testuser", password="password123")
    corpus = Corpus.objects.create(name="Test Corpus", owner=user)
    file = CorpusTextFile.objects.create(
        corpus=corpus,
        path="test.txt",
        content="This is some test content.",
        checksum="dummychecksum1234567890",
    )

    assert file.corpus == corpus
    assert file.path == "test.txt"
    assert file.content == "This is some test content."
    assert file.checksum == "dummychecksum1234567890"
    assert file.created_at <= timezone.now()
    assert file.updated_at <= timezone.now()
    assert str(file) == f"{corpus.name}:{file.path}"


@pytest.mark.django_db
def test_split_creation():
    """Test creating a Split instance."""
    user = User.objects.create(username="testuser", password="password123")
    corpus = Corpus.objects.create(name="Test Corpus", owner=user)
    file = CorpusTextFile.objects.create(
        corpus=corpus,
        path="test.txt",
        content="Split content.",
    )
    split = Split.objects.create(file=file, order=1, content="First split part")

    assert split.file == file
    assert split.order == 1
    assert split.content == "First split part"
    assert str(split) == f"{file.corpus.name}:{file.path}:{split.order}"


@patch("corpora_ai.provider_loader.load_llm_provider")
@pytest.mark.django_db
def test_get_and_save_summary(mock_llm_provider):
    """Test CorpusTextFile `get_and_save_summary` method."""
    mock_llm_provider.return_value.get_summary.return_value = "Mock summary"
    user = User.objects.create(username="testuser", password="password123")
    corpus = Corpus.objects.create(name="Test Corpus", owner=user)
    file = CorpusTextFile.objects.create(
        corpus=corpus,
        path="test.txt",
        content="Some content",
    )

    file.get_and_save_summary()

    assert file.ai_summary == "Mock summary"
    file.refresh_from_db()
    assert file.ai_summary == "Mock summary"


@patch("corpora_ai.provider_loader.load_llm_provider")
@pytest.mark.django_db
@pytest.mark.skip(reason="Flaky test, needs investigation")
def test_get_and_save_vector_of_summary(mock_llm_provider):
    """Test CorpusTextFile `get_and_save_vector_of_summary` method."""
    mock_llm_provider.return_value.get_embedding.return_value = [0.1] * 1536
    user = User.objects.create(username="testuser", password="password123")
    corpus = Corpus.objects.create(name="Test Corpus", owner=user)
    file = CorpusTextFile.objects.create(
        corpus=corpus,
        path="test.txt",
        ai_summary="Summary content",
    )

    file.get_and_save_vector_of_summary()

    assert all(a == b for a, b in zip(file.vector_of_summary, [0.1] * 1536))
    file.refresh_from_db()
    assert all(a == b for a, b in zip(file.vector_of_summary, [0.1] * 1536))


@patch("corpora_ai.provider_loader.load_llm_provider")
@pytest.mark.django_db
@pytest.mark.skip(reason="Flaky test, needs investigation")
def test_get_and_save_vector_on_split(mock_llm_provider):
    """Test Split `get_and_save_vector` method."""
    mock_llm_provider.return_value.get_embedding.return_value = [0.2] * 1536
    user = User.objects.create(username="testuser", password="password123")
    corpus = Corpus.objects.create(name="Test Corpus", owner=user)
    file = CorpusTextFile.objects.create(corpus=corpus, path="test.txt")
    split = Split.objects.create(
        file=file,
        order=1,
        content="Content to vectorize",
    )

    split.get_and_save_vector()

    assert all(a == b for a, b in zip(split.vector, [0.2] * 1536))
    split.refresh_from_db()
    assert all(a == b for a, b in zip(split.vector, [0.2] * 1536))
