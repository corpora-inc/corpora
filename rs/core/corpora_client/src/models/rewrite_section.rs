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
pub struct RewriteSection {
    #[serde(rename = "section_id")]
    pub section_id: uuid::Uuid,
    #[serde(rename = "introduction")]
    pub introduction: String,
}

impl RewriteSection {
    pub fn new(section_id: uuid::Uuid, introduction: String) -> RewriteSection {
        RewriteSection {
            section_id,
            introduction,
        }
    }
}
