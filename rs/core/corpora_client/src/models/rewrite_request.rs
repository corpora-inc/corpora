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
pub struct RewriteRequest {
    #[serde(rename = "provider")]
    pub provider: String,
    #[serde(rename = "config")]
    pub config: std::collections::HashMap<String, serde_json::Value>,
    #[serde(rename = "prompt", skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
}

impl RewriteRequest {
    pub fn new(
        provider: String,
        config: std::collections::HashMap<String, serde_json::Value>,
    ) -> RewriteRequest {
        RewriteRequest {
            provider,
            config,
            prompt: None,
        }
    }
}
