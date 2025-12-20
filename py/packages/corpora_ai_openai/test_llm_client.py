import unittest
from unittest.mock import MagicMock, patch

from corpora_ai.llm_interface import ChatCompletionTextMessage

from corpora_ai_openai.llm_client import OpenAIClient


class TestOpenAIClient(unittest.TestCase):
    @patch("corpora_ai_openai.llm_client.OpenAI")
    def setUp(self, MockOpenAI):
        """Set up the OpenAIClient instance and mock OpenAI API client."""
        self.mock_openai_client = MockOpenAI.return_value
        self.client = OpenAIClient(api_key="test_api_key")

    def test_get_text_completion_success(self):
        mock_response = MagicMock()
        mock_response.output_text = "This is a test response."
        self.mock_openai_client.responses.create.return_value = mock_response

        messages = [
            ChatCompletionTextMessage(role="user", text="Tell me a joke."),
        ]

        response = self.client.get_text_completion(messages)
        self.assertEqual(response, "This is a test response.")

        self.mock_openai_client.responses.create.assert_called_once_with(
            model=self.client.completion_model,
            input=[{"role": "user", "content": "Tell me a joke."}],
        )

    def test_get_embedding_success(self):
        """Test that get_embedding returns the correct embedding vector."""
        # Mock response from OpenAI API
        mock_response = MagicMock()
        mock_response.data = [MagicMock()]
        mock_response.data[0].embedding = [0.1, 0.2, 0.3]
        self.mock_openai_client.embeddings.create.return_value = mock_response

        # Call get_embedding and assert response
        response = self.client.get_embedding("Sample text for embedding")
        self.assertEqual(response, [0.1, 0.2, 0.3])

        # Ensure OpenAI API was called with correct parameters
        self.mock_openai_client.embeddings.create.assert_called_once_with(
            input="Sample text for embedding",
            model="text-embedding-3-small",
        )

    def test_get_text_completion_empty_messages(self):
        """Test that get_text_completion raises an error when messages list is empty."""
        with self.assertRaises(ValueError):
            self.client.get_text_completion([])

    def test_get_embedding_empty_text(self):
        """Test that get_embedding raises an error when text is empty."""
        with self.assertRaises(ValueError):
            self.client.get_embedding("")


if __name__ == "__main__":
    unittest.main()
