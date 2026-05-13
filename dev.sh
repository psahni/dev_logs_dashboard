#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Dev Digest..."

# Backend
cd "$ROOT/backend"
uv run uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend  -> http://localhost:8000  (docs: http://localhost:8000/docs)  [PID $BACKEND_PID]"
echo "Frontend -> http://localhost:3000  [PID $FRONTEND_PID]"
echo ""
echo "Press Ctrl+C to stop both services."

# Stop both on Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
