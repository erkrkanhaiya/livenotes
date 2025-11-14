#!/bin/bash
# Script to create simple icons for Chrome Extension

# This is a tiny 1x1 blue PNG encoded in base64
BLUE_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Create icons directory if it doesn't exist
mkdir -p dist/icons

# Create simple blue PNG files for all icon sizes
for size in 16 32 48 128; do
    echo "$BLUE_PNG" | base64 -d > "dist/icons/icon${size}.png"
done

echo "Created placeholder blue PNG icons for Chrome Extension"