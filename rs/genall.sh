#!/bin/bash
set -e  # Exit on any error

# Define constants
SPEC_URL="http://corpora-app:8877/api/openapi.json"
OUTPUT_DIR="core/corpora_client"
TEMP_DIR="gen"

echo "Step 1: Fetching OpenAPI spec from $SPEC_URL..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
curl -o "$TEMP_DIR/openapi.json" "$SPEC_URL"

# supportAsync=false is a workaround for file upload issues
echo "Step 2: Generating Rust client library..."
npx @openapitools/openapi-generator-cli generate \
    -i "$TEMP_DIR/openapi.json" \
    -g rust \
    -o "$TEMP_DIR/corpora_client" \
    --additional-properties=packageName=corpora_client,library=reqwest,supportAsync=false

echo "Step 3: Moving generated code to $OUTPUT_DIR..."
rm -rf "$OUTPUT_DIR/src" "$OUTPUT_DIR/Cargo.toml"
mkdir -p "$OUTPUT_DIR"
cp -r "$TEMP_DIR/corpora_client/src" "$OUTPUT_DIR/src"
cp "$TEMP_DIR/corpora_client/Cargo.toml" "$OUTPUT_DIR"

echo "Step 4: Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "Step 5: Formatting the codebase..."
cargo fmt
# cargo clippy --workspace --all-targets -- -D warnings
cargo clippy --workspace --all-targets -- -A clippy::uninlined-format-args -D warnings

echo "Step 6: Verifying the workspace..."
cargo build
cargo test

echo "Rust client generation complete!"
cargo run
