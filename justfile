# Default - show available commands
default:
    @just --list


# Start PostgreSQL in Docker, then run dev servers natively via Bun
start:
    docker compose up -d db
    @echo "Waiting for PostgreSQL..."
    @until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
    bun install --force
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
