from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

app = FastAPI()

# model_name = "facebook/nllb-200-distilled-600M"
model_name = "facebook/nllb-200-1.3B"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Mapping ISO 639-1 codes to NLLB-200 language codes
# Mapping ISO 639-1 codes to NLLB-200 language codes
lang_map = {
    "af": "afr_Latn",
    "am": "amh_Ethi",
    "ar": "arb_Arab",
    "as": "asm_Beng",
    "az": "azj_Latn",
    "be": "bel_Cyrl",
    "bg": "bul_Cyrl",
    "bn": "ben_Beng",
    "bo": "bod_Tibt",
    "br": "bre_Latn",
    "bs": "bos_Latn",
    "ca": "cat_Latn",
    "ceb": "ceb_Latn",
    "ckb": "ckb_Arab",
    "cs": "ces_Latn",
    "cy": "cym_Latn",
    "da": "dan_Latn",
    "de": "deu_Latn",
    "dv": "div_Thaa",
    "dz": "dzo_Tibt",
    "el": "ell_Grek",
    "en": "eng_Latn",
    "eo": "epo_Latn",
    "es": "spa_Latn",
    "et": "est_Latn",
    "eu": "eus_Latn",
    "fa": "pes_Arab",
    "fi": "fin_Latn",
    "fil": "fil_Latn",
    "fo": "fao_Latn",
    "fr": "fra_Latn",
    "fy": "fry_Latn",
    "ga": "gle_Latn",
    "gd": "gla_Latn",
    "gl": "glg_Latn",
    "gu": "guj_Gujr",
    "ha": "hau_Latn",
    "haw": "haw_Latn",
    "he": "heb_Hebr",
    "hi": "hin_Deva",
    "hr": "hrv_Latn",
    "ht": "hat_Latn",
    "hu": "hun_Latn",
    "hy": "hye_Armn",
    "id": "ind_Latn",
    "ig": "ibo_Latn",
    "is": "isl_Latn",
    "it": "ita_Latn",
    "ja": "jpn_Jpan",
    "jv": "jav_Latn",
    "ka": "kat_Geor",
    "kk": "kaz_Cyrl",
    "km": "khm_Khmr",
    "kn": "kan_Knda",
    "ko": "kor_Hang",
    "ku": "kmr_Latn",
    "ky": "kir_Cyrl",
    "la": "lat_Latn",
    "lb": "ltz_Latn",
    "lo": "lao_Laoo",
    "lt": "lit_Latn",
    "lv": "lvs_Latn",
    "mg": "mlg_Latn",
    "mi": "mri_Latn",
    "mk": "mkd_Cyrl",
    "ml": "mal_Mlym",
    "mn": "khk_Cyrl",
    "mr": "mar_Deva",
    "ms": "zsm_Latn",
    "mt": "mlt_Latn",
    "my": "mya_Mymr",
    "ne": "npi_Deva",
    "nl": "nld_Latn",
    "no": "nob_Latn",
    "ny": "nya_Latn",
    "or": "ory_Orya",
    "pa": "pan_Guru",
    "pl": "pol_Latn",
    "ps": "pbt_Arab",
    "pt": "por_Latn",
    "qu": "quy_Latn",
    "ro": "ron_Latn",
    "ru": "rus_Cyrl",
    "rw": "kin_Latn",
    "sd": "snd_Arab",
    "si": "sin_Sinh",
    "sk": "slk_Latn",
    "sl": "slv_Latn",
    "sm": "smo_Latn",
    "sn": "sna_Latn",
    "so": "som_Latn",
    "sq": "als_Latn",
    "sr": "srp_Cyrl",
    "st": "sot_Latn",
    "su": "sun_Latn",
    "sv": "swe_Latn",
    "sw": "swh_Latn",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "tg": "tgk_Cyrl",
    "th": "tha_Thai",
    "ti": "tir_Ethi",
    "tk": "tuk_Latn",
    "tl": "tgl_Latn",
    "tr": "tur_Latn",
    "tt": "tat_Cyrl",
    "ug": "uig_Arab",
    "uk": "ukr_Cyrl",
    "ur": "urd_Arab",
    "uz": "uzn_Latn",
    "vi": "vie_Latn",
    "xh": "xho_Latn",
    "yi": "ydd_Hebr",
    "yo": "yor_Latn",
    "zh": "zho_Hans",
    "zh-TW": "zho_Hant",
    "zu": "zul_Latn",
}


class TranslationRequest(BaseModel):
    text: str
    source_lang: str  # e.g. "en"
    target_lang: str  # e.g. "fr"


@app.post("/translate")
def translate(req: TranslationRequest):
    try:
        src = lang_map[req.source_lang]
        tgt = lang_map[req.target_lang]
    except KeyError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language code: {e.args[0]}",
        )

    tokenizer.src_lang = src
    encoded = tokenizer(req.text, return_tensors="pt")

    output_tokens = model.generate(
        **encoded,
        forced_bos_token_id=tokenizer.convert_tokens_to_ids(tgt),
        max_length=100,
        num_beams=4,
    )

    decoded = tokenizer.batch_decode(output_tokens, skip_special_tokens=True)
    return {"translation": decoded[0]}
