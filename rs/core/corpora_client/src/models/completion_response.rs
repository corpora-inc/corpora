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
pub struct CompletionResponse {
    #[serde(rename = "text")]
    pub text: String,
}

impl CompletionResponse {
    pub fn new(text: String) -> CompletionResponse {
        CompletionResponse { text }
    }
}
