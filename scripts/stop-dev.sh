#!/usr/bin/env bash
# Stop dev servers and the database container.
# Use this if 'just' is not installed: ./scripts/stop-dev.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Stopping dev servers..."
pkill -f "bun.*dev" || true

echo "Stopping database..."
docker compose stop db

echo "Stopped."
