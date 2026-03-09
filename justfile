# Default - show available commands
default:
    @just --list


# One-time idempotent setup: deps, DB container, schema push, seed
install:
    bun install --force
    docker compose up -d db
    @echo "Waiting for PostgreSQL..."
    @until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
    bun db:push
    @echo "Setup complete. Run 'just start' to launch dev servers."

# Start PostgreSQL in Docker, then run dev servers natively via Bun
start:
    docker compose up -d db
    @until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
    bun dev

# Stop dev servers and the database container
stop:
    -pkill -f "bun.*dev" || true
    docker compose down db

# Start all services (db, web, api, app) via Docker Compose
docker-start:
    docker compose up -d

# Stop all Docker services
docker-stop:
    docker compose down

# ============================================
# COMMIT HELPERS
# ============================================
commit:
    MAX_THINKING_TOKENS=0 glm -p "/commit-commands:commit" --model=haiku --tools "Bash" --allowedTools 'Bash(git add:*),Bash(git status:*),Bash(git commit:*),Bash(git diff:*),Bash(git branch:*),Bash(git log:*)' --setting-sources='project' --strict-mcp-config --mcp-config '{"mcpServers":{}}' --no-session-persistence
    @just notify commit

commit-pi:
    pi -p "/commit-commands-commit" --model zai/glm-5 --tools "bash" --no-extensions --no-skills --no-session

# ============================================
# BROWSER AUTOMATION (BOWSER)
# ============================================

# Run all user stories in parallel via bowser QA agents
ui-review *args:
    claude "/ui-review {{args}}"

# Run user stories with visible browser
ui-review-headed *args:
    claude "/ui-review headed {{args}}"


# Notification helper (plays TTS + prints message)
notify type:
    @uv run .claude/hooks/utils/notifications.py {{ type }}
