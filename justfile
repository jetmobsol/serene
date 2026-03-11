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

# Start DB + dev servers in tmux with separate windows per service
dev:
    docker compose up -d db
    @until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
    @tmux kill-session -t serene 2>/dev/null || true
    tmux new-session -d -s serene -n api
    tmux send-keys -t serene:api 'bun api:dev' Enter
    tmux new-window -t serene -n app
    tmux send-keys -t serene:app 'bun app:dev' Enter
    tmux new-window -t serene -n web
    tmux send-keys -t serene:web 'bun web:dev' Enter
    @echo "tmux session 'serene' started with windows: api, app, web"
    @echo "Attach with: tmux attach -t serene"
    tmux attach -t serene

# Stop all dev servers, kill tmux session, and stop DB
dev-stop:
    @tmux kill-session -t serene 2>/dev/null && echo "tmux session 'serene' killed" || echo "No tmux session 'serene' found"
    -pkill -f "bun.*dev" || true
    docker compose down db

# Run all tests, typecheck, lint, and format check
check-all:
    bun run test --run
    bun typecheck
    bun lint
    bun prettier --write .
    bun prettier --check .

# ============================================
# DEPLOYMENT
# ============================================

# Build and deploy all workers to production (api → app → web)
deploy-prod:
    @echo "Building all workspaces..."
    bun run build
    @echo "Deploying API worker..."
    bun run api:deploy
    @echo "Deploying App worker..."
    bun run app:deploy
    @echo "Deploying Web worker..."
    bun run web:deploy
    @echo "All workers deployed. Verify: curl -i https://serene.linktalentsbot.work/api"

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
    glm --dangerously-skip-permissions "/ui-review {{args}}"

# Run user stories with visible browser
ui-review-headed *args:
    glm --dangerously-skip-permissions "/ui-review {{args}} headed"


# Notification helper (plays TTS + prints message)
notify type:
    @uv run .claude/hooks/utils/notifications.py {{ type }}
