#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
ACTION="${1:-start}"

stop_services() {
    echo "Stopping Dev Digest..."

    # Kill by PID file if available
    if [ -f "$ROOT/.dev.pids" ]; then
        while IFS= read -r pid; do
            kill "$pid" 2>/dev/null && echo "  Killed PID $pid" || true
        done < "$ROOT/.dev.pids"
        rm -f "$ROOT/.dev.pids"
    fi

    # Kill any process holding port 8000 (uvicorn)
    pid8000=$(lsof -ti :8000 2>/dev/null || true)
    if [ -n "$pid8000" ]; then
        kill -9 $pid8000 2>/dev/null && echo "  Stopped backend (port 8000)" || true
    fi

    # Kill any process holding port 3000 (Next.js)
    pid3000=$(lsof -ti :3000 2>/dev/null || true)
    if [ -n "$pid3000" ]; then
        kill -9 $pid3000 2>/dev/null && echo "  Stopped frontend (port 3000)" || true
    fi

    echo "Done."
}

if [ "$ACTION" = "stop" ]; then
    stop_services
    exit 0
fi

# start
echo "Starting Dev Digest..."

cd "$ROOT/backend"
uv run uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

# Save PIDs for stop command
echo "$BACKEND_PID" > "$ROOT/.dev.pids"
echo "$FRONTEND_PID" >> "$ROOT/.dev.pids"

echo ""
echo "Backend  -> http://localhost:8000  (docs: http://localhost:8000/docs)  [PID $BACKEND_PID]"
echo "Frontend -> http://localhost:3000  [PID $FRONTEND_PID]"
echo ""
echo "Press Ctrl+C to stop both services, or run: ./dev.sh stop"

trap "stop_services; exit 0" INT TERM
wait
