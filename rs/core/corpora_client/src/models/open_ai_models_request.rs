/*
 * Corpora API
 *
 * API for managing and processing corpora
 *
 * The version of the OpenAPI document: 0.1.0
 *
 * Generated by: https://openapi-generator.tech
 */

use crate::models;
use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Debug, PartialEq, Serialize, Deserialize)]
pub struct OpenAiModelsRequest {
    #[serde(
        rename = "api_key",
        default,
        with = "::serde_with::rust::double_option",
        skip_serializing_if = "Option::is_none"
    )]
    pub api_key: Option<Option<String>>,
}

impl OpenAiModelsRequest {
    pub fn new() -> OpenAiModelsRequest {
        OpenAiModelsRequest { api_key: None }
    }
}
