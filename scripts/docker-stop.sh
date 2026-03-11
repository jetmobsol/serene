#!/usr/bin/env bash
# Stop all Docker Compose services.
# Use this if 'just' is not installed: ./scripts/docker-stop.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Stopping all Docker services..."
docker compose down

echo "Stopped."
