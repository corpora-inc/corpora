import base64
import json
from typing import TYPE_CHECKING, List, Type, TypeVar

from corpora_ai.llm_interface import (
    ChatCompletionTextMessage,
    GeneratedImage,
    LLMBaseInterface,
)
from openai import AzureOpenAI, OpenAI, OpenAIError
from pydantic import BaseModel

if TYPE_CHECKING:
    from openai.types.images_response import ImagesResponse


T = TypeVar("T", bound=BaseModel)


class OpenAIClient(LLMBaseInterface):
    def __init__(
        self,
        api_key: str,
        # TODO: we probably do need some way
        # to specify in runtime which model to use ;/
        # I think we will have to expand the interface with options
        # completion_model: str = "gpt-4o-mini",
        # completion_model: str = "gpt-4o",
        # completion_model: str = "o3-mini",
        # completion_model: str = "o4-mini",
        # completion_model: str = "o3",
        completion_model: str = "gpt-4.1",
        embedding_model: str = "text-embedding-3-small",
        image_model: str = "gpt-image-1",
        azure_endpoint: str = None,
    ):
        if azure_endpoint:
            self.client = AzureOpenAI(
                api_key=api_key,
                azure_endpoint=azure_endpoint,
                # TODO: we should make this a parameter or what?
                api_version="2024-10-01-preview",
            )
        else:
            self.client = OpenAI(api_key=api_key)
        self.completion_model = completion_model
        self.embedding_model = embedding_model
        self.image_model = image_model

    def get_text_completion(
        self,
        messages: List[ChatCompletionTextMessage],
    ) -> str:
        if not messages:
            raise ValueError("Input messages must not be empty.")
        # Convert Message objects to dictionaries for the OpenAI API
        message_dicts = [
            {"role": msg.role, "content": msg.text} for msg in messages
        ]
        response = self.client.chat.completions.create(
            model=self.completion_model,
            messages=message_dicts,
        )
        return response.choices[0].message.content

    def get_data_completion(
        self,
        messages: List[ChatCompletionTextMessage],
        model: Type[T],
    ) -> T:
        """Generates structured data completion using OpenAI's function calling.

        Args:
            messages (List[ChatCompletionTextMessage]): Input messages for the completion.
            model (Type[BaseModel]): A Pydantic model class to validate and structure the output.

        Returns:
            BaseModel: An instance of the provided Pydantic model populated with data.

        """
        if not issubclass(model, BaseModel):
            raise ValueError("Schema must be a subclass of pydantic.BaseModel.")

        if not messages:
            raise ValueError("Input messages must not be empty.")

        # Prepare messages for OpenAI API
        message_dicts = [
            {"role": msg.role, "content": msg.text} for msg in messages
        ]

        # Generate JSON Schema from the Pydantic model
        json_schema = model.model_json_schema()

        # Define the function for OpenAI's function calling
        function = {
            "name": "generate_data",
            "description": "Generate data based on the provided schema.",
            "parameters": json_schema,
        }

        try:
            # Call OpenAI API with function calling
            response = self.client.chat.completions.create(
                model=self.completion_model,
                messages=message_dicts,
                functions=[function],
                function_call={"name": "generate_data"},
            )

            # Extract and parse function arguments
            function_args = response.choices[0].message.function_call.arguments
            data_dict = json.loads(function_args)
            print(f"Function arguments: {data_dict}")
            return model.model_validate(data_dict)
        except OpenAIError as e:
            raise RuntimeError(f"Failed to generate data completion: {e}")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse function arguments: {e}")

    def get_image(
        self,
        prompt: str,
        **kwargs,
    ) -> List[GeneratedImage]:
        """
        Generate one or more images.

        Args:
            prompt: Natural-language description of the desired image.
            kwargs: Passed through to OpenAI API (e.g. n, size).

        Returns:
            A list of GeneratedImage with raw bytes and the appropriate format ("png").
        """
        # build the core params
        params = {
            "model": self.image_model,
            "prompt": prompt,
            # "response_format": "b64_json",
            "n": 1,
            "size": "1024x1024",
        }
        # merge in any overrides (e.g. size="1536x1024", n=2)
        params.update(kwargs)
        resp: ImagesResponse = self.client.images.generate(**params)

        images: List[GeneratedImage] = []
        for img in resp.data:
            raw = base64.b64decode(img.b64_json)
            images.append(GeneratedImage(data=raw, format="png"))

        return images

    def get_embedding(self, text: str) -> List[float]:
        if not text:
            raise ValueError("Input text must not be empty.")
        response = self.client.embeddings.create(
            input=text,
            model=self.embedding_model,
        )
        return response.data[0].embedding
