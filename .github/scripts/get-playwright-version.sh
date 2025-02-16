#!/bin/bash

set -euo pipefail

playwright_version=$(pnpm list --depth 1 --json | jq -r '.[].devDependencies["@playwright/test"].version')

echo "Found Playwright version: $playwright_version"
echo "version=$playwright_version" >>"$GITHUB_OUTPUT"
