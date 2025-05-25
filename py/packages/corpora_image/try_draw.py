import argparse
import re
from pathlib import Path

import torch
from diffusers import DiffusionPipeline


def slugify(value: str) -> str:
    # Simple slugify for filenames: lower, replace non-word with '_', trim
    value = value.lower()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[\s-]+", "_", value).strip("_")
    return value


def make_prompt(text: str) -> str:
    return (
        f"A simple, creative, flat vector illustration of: {text}. "
        "Minimalist stick-figure characters, bold outlines, pastel background, minimal details, centered composition, no text, no shading, in the style of educational memory cards. "
        "A simple image that conveys the meaning of the phrase in a simple way."
    )


def main():
    parser = argparse.ArgumentParser(
        description="Generate a language learning illustration from a phrase using SDXL.",
    )
    parser.add_argument(
        "phrase",
        type=str,
        help="Phrase, word, or sentence to illustrate.",
    )
    parser.add_argument(
        "--width",
        type=int,
        default=128,
        help="Image width (default: 128)",
    )
    parser.add_argument(
        "--height",
        type=int,
        default=128,
        help="Image height (default: 128)",
    )
    parser.add_argument(
        "--steps",
        type=int,
        default=20,
        help="Inference steps (default: 20)",
    )
    parser.add_argument(
        "--sampler",
        type=str,
        default="EulerAncestralDiscreteScheduler",
        help="Sampler name (default: EulerAncestralDiscreteScheduler)",
    )
    parser.add_argument(
        "--outdir",
        type=str,
        default="output",
        help="Output directory (default: ./output)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="./models/sdxl-base",
        help="Path or HF repo for the model",
    )
    args = parser.parse_args()

    Path(args.outdir).mkdir(parents=True, exist_ok=True)

    phrase = args.phrase.strip()
    prompt = make_prompt(phrase)
    # negative_prompt = "photo, photorealistic, realistic, complex, detailed background, text, watermark, shadow, dramatic lighting"
    negative_prompt = "photorealistic, realistic, complex background, people, text, watermark, blurry, abstract, extra limbs, body, noise"

    print(
        f"Loading model: {args.model} (this may take a while on first run)...",
    )
    pipe = DiffusionPipeline.from_pretrained(
        args.model,
        torch_dtype=torch.float16,
        variant="fp16",
    ).to("mps")
    print(f"Scheduler: {pipe.scheduler.__class__.__name__}")

    # # Try to change the scheduler (sampler) if available
    # try:
    #     if hasattr(pipe, args.sampler):
    #         pipe.scheduler = getattr(pipe, args.sampler).from_config(
    #             pipe.scheduler.config,
    #         )
    #     elif hasattr(__import__("diffusers"), args.sampler):
    #         sampler_class = getattr(__import__("diffusers"), args.sampler)
    #         pipe.scheduler = sampler_class.from_config(pipe.scheduler.config)
    #     else:
    #         print(f"Sampler '{args.sampler}' not found, using default.")
    # except Exception as e:
    #     print(f"Warning: Could not set sampler '{args.sampler}': {e}")

    print(
        f"Generating image for: '{phrase}' ({args.width}x{args.height}, steps={args.steps})",
    )
    image = pipe(
        prompt,
        negative_prompt=negative_prompt,
        width=args.width,
        height=args.height,
        num_inference_steps=args.steps,
    ).images[0]

    filename = f"{slugify(phrase)}_{args.width}x{args.height}.png"
    filepath = Path(args.outdir) / filename
    image.save(filepath)
    print(f"Image saved as {filepath}")


if __name__ == "__main__":
    main()


# import torch
# from diffusers import DiffusionPipeline

# pipe = DiffusionPipeline.from_pretrained(
#     "./models/sdxl-base",
#     torch_dtype=torch.float16,
#     variant="fp16",
# ).to("mps")  # Use "mps" for Apple Silicon

# prompt = "A futuristic cityscape at sunset, highly detailed, 8k resolution"
# image = pipe(prompt).images[0]
# image.save("output.png")
