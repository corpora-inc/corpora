import unittest
from unittest.mock import MagicMock, patch

from corpora_ai.llm_interface import ChatCompletionTextMessage

from corpora_ai_xai.llm_client import XAIClient


class TestOpenAIClient(unittest.TestCase):
    @patch("corpora_ai_xai.llm_client.OpenAI")
    def setUp(self, MockOpenAI):
        """Set up the OpenAIClient instance and mock OpenAI API client."""
        self.mock_openai_client = MockOpenAI.return_value
        self.client = XAIClient(api_key="test_api_key")

    def test_get_text_completion_success(self):
        """Test that get_text_completion returns the correct response text."""
        # Mock response from OpenAI API
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is a test response."
        self.mock_openai_client.chat.completions.create.return_value = (
            mock_response
        )

        # Define test messages
        messages = [
            ChatCompletionTextMessage(role="user", text="Tell me a joke."),
        ]

        self.client.get_text_completion(messages)

    def test_get_text_completion_empty_messages(self):
        """Test that get_text_completion raises an error when messages list is empty."""
        with self.assertRaises(ValueError):
            self.client.get_text_completion([])


if __name__ == "__main__":
    unittest.main()
