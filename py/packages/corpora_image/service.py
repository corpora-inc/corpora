import base64
import io
from typing import List, Optional

import torch
import uvicorn
from diffusers import DiffusionPipeline
from fastapi import FastAPI
from PIL import Image
from pydantic import BaseModel

app = FastAPI()

# Load model once on startup
MODEL_PATH = "./models/sdxl-base"
pipe = DiffusionPipeline.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.float16,
    variant="fp16",
).to("mps")  # or "cuda" if using CUDA machine

# NEGATIVE_PROMPT = "photorealistic, realistic, complex background, people, text, watermark, blurry, abstract, extra limbs, body, noise"
NEGATIVE_PROMPT = "margin"


class ImageRequest(BaseModel):
    # TODO: add support for other models? cache pretrained pipes loaded?
    model: Optional[str] = None
    prompt: str
    n: Optional[int] = 1
    size: Optional[str] = "1024x1024"
    response_format: Optional[str] = "b64_json"


class ImageData(BaseModel):
    b64_json: str


class ImagesResponse(BaseModel):
    created: int
    data: List[ImageData]


def generate_images(prompt: str, n: int, size: str) -> List[Image.Image]:
    width, height = map(int, size.split("x"))
    images = []
    for _ in range(n):
        result = pipe(
            prompt,
            # TODO: could be cool dynamic?
            negative_prompt=NEGATIVE_PROMPT,
            width=width,
            height=height,
            num_inference_steps=30,
        )
        images.append(result.images[0])
    return images


@app.post("/v1/images/generations", response_model=ImagesResponse)
def create_images(req: ImageRequest):
    images = generate_images(req.prompt, req.n, req.size)

    out_data = []
    for img in images:
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        out_data.append(ImageData(b64_json=b64))

    return ImagesResponse(created=0, data=out_data)


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=9027,
        reload=False,
    )
