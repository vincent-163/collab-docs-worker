#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN with Workers Scripts Write permission}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-866d7003697784726c578ca9bd665865}"

npm ci
npm test
npx wrangler deploy
curl --fail --silent --show-error --retry 5 --retry-delay 3 https://workers.v-163.top/docs/health
