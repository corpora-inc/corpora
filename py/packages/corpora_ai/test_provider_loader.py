# py/packages/corpora_ai/test_provider_loader.py

import os
import unittest
from unittest.mock import MagicMock, patch

from corpora_ai.llm_interface import LLMBaseInterface
from corpora_ai.provider_loader import load_llm_provider


class TestLoadLLMProvider(unittest.TestCase):
    @patch.dict(
        os.environ,
        {"LLM_PROVIDER": "openai", "OPENAI_API_KEY": "test_api_key"},
    )
    @patch("corpora_ai.provider_loader.OpenAIClient")
    def test_load_openai_provider_success(self, MockOpenAIClient):
        """Test loading the OpenAI provider successfully when environment variables are set correctly."""
        mock_client_instance = MagicMock(spec=LLMBaseInterface)
        MockOpenAIClient.return_value = mock_client_instance

        provider = load_llm_provider()

        MockOpenAIClient.assert_called_once_with(
            api_key="test_api_key",
            azure_endpoint=None,
        )
        self.assertIsInstance(provider, LLMBaseInterface)
        self.assertEqual(provider, mock_client_instance)

    @patch.dict(os.environ, {"LLM_PROVIDER": "openai", "OPENAI_API_KEY": ""})
    @patch("corpora_ai.provider_loader.OpenAIClient")
    def test_missing_openai_api_key(self, MockOpenAIClient):
        """Test that ValueError is raised if the OPENAI_API_KEY environment variable is not set."""
        MockOpenAIClient.side_effect = None  # ensure the class exists

        with self.assertRaises(ValueError) as context:
            load_llm_provider()

        # now matches the actual exception message
        self.assertEqual(
            str(context.exception),
            "OPENAI_API_KEY environment variable is not set.",
        )

    @patch.dict(os.environ, {"LLM_PROVIDER": "unsupported_provider"})
    def test_invalid_provider(self):
        """Test that ValueError is raised when an unsupported provider is specified."""
        with self.assertRaises(ValueError) as context:
            load_llm_provider()

        self.assertEqual(str(context.exception), "No valid LLM provider found.")

    @patch.dict(os.environ, {})
    @patch("corpora_ai.provider_loader.OpenAIClient", None)
    def test_no_provider_found(self):
        """Test that an error bubbles up when no provider class is available."""
        # Since OPENAI_CLIENT is None and default provider is 'openai',
        # calling load_llm_provider() will end up doing OpenAIClient(...) -> TypeError
        with self.assertRaises(TypeError):
            load_llm_provider()


if __name__ == "__main__":
    unittest.main()
