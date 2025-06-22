# corpora_commander/api.py
import httpx
from ninja import Router
from pydantic import BaseModel

router = Router(tags=["commander"])


class LMStudioPing(BaseModel):
    base_url: str


@router.post("/lmstudio/models")
def list_lmstudio_models(request, data: LMStudioPing):
    """
    Fetch the list of model names from LM Studio.
    """
    resp = httpx.get(f"{data.base_url}/models", timeout=5.0)
    if resp.status_code != 200:
        return request.error_out(status=resp.status_code, message=resp.text)
    # assume the LM Studio /models endpoint returns JSON array of strings
    models = resp.json()
    return {"models": models}
