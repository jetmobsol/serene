#!/usr/bin/env bash
# Start PostgreSQL in Docker, then run dev servers natively via Bun.
# Use this if 'just' is not installed: ./scripts/start-dev.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Installing dependencies..."
bun install --force

echo "Starting PostgreSQL..."
docker compose up -d db

echo "Waiting for PostgreSQL..."
until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done

echo "Starting dev servers..."
bun dev
