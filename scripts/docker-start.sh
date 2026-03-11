#!/usr/bin/env bash
# Start all services via Docker Compose.
# Use this if 'just' is not installed: ./scripts/docker-start.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Starting all services via Docker Compose..."
docker compose up -d --build

echo "All services started."
echo "App: http://localhost:5173"
echo "API: http://localhost:8787"
echo "Web: http://localhost:4321"
