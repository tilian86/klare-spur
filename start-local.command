#!/bin/zsh

set -e

PORT="${1:-4187}"
APP_DIR="/Users/florian/Projects/apps/klare-spur"

cd "$HOME"
python3 "$APP_DIR/server.py" "$PORT" &
SERVER_PID=$!

sleep 1
open "http://127.0.0.1:${PORT}"

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM
wait "$SERVER_PID"
