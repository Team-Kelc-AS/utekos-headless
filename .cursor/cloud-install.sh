#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"

node_major() {
  node -p "process.versions.node.split('.')[0]" 2>/dev/null || true
}

if [ "$(node_major)" != "24" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install "$NODE_VERSION"
  nvm use --silent "$NODE_VERSION"
fi

if [ "$(node_major)" != "24" ]; then
  echo "Cloud install requires Node 24.x from .nvmrc (got $(command -v node || true) $(node -v 2>/dev/null || echo missing))." >&2
  exit 1
fi

corepack enable
corepack install
pnpm install --frozen-lockfile

# Cloud clones omit gitignored AGENTS.md. Seed it from the tracked contract.
if [ ! -f AGENTS.md ] && [ -f CURSOR_CLOUD.md ]; then
  cp CURSOR_CLOUD.md AGENTS.md
fi
