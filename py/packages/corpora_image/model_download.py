from huggingface_hub import snapshot_download

# Example: Download SDXL 1.0
snapshot_download(
    repo_id="stabilityai/stable-diffusion-xl-base-1.0",
    local_dir="./models/sdxl-base",
)

# snapshot_download(
#     repo_id="valhalla/emoji-diffusion",
#     local_dir="./models/emoji-diffusion",
# )
