#!/usr/bin/env bash
# Starts the backend and frontend with hot reloading. See README.md.
set -euo pipefail

# Give each background job its own process group, so stopping one stops its whole
# tree (uv -> uvicorn -> reload worker). Killing only the direct child leaves those
# grandchildren alive and holding the ports.
set -m

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for cmd in uv pnpm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "dev.sh: '$cmd' is not installed. See the Prerequisites section of README.md." >&2
    exit 1
  fi
done

if [[ ! -f "$root/.env" ]]; then
  cp "$root/.env.example" "$root/.env"
  echo "dev.sh: created .env from .env.example"
fi

# Sync only when the lockfile is newer than the installed tree.
if [[ ! -d "$root/backend/.venv" || "$root/backend/uv.lock" -nt "$root/backend/.venv" ]]; then
  echo "dev.sh: syncing backend dependencies"
  uv sync --project "$root/backend" --extra dev
fi

if [[ ! -d "$root/frontend/node_modules" || "$root/frontend/pnpm-lock.yaml" -nt "$root/frontend/node_modules" ]]; then
  echo "dev.sh: installing frontend dependencies"
  pnpm --dir "$root/frontend" install
fi

# Run from backend/ so alembic finds alembic.ini and SQLite lands in backend/.
(cd "$root/backend" && uv run alembic upgrade head)

pids=()

# Runs on Ctrl+C, on SIGTERM, and when either child exits on its own. Only the
# groups started below are signalled, never anything else on the machine.
cleanup() {
  trap - EXIT INT TERM
  for pid in "${pids[@]}"; do
    kill -TERM -- "-$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Loopback only: nothing here is meant to be reachable from the network.
(cd "$root/backend" && exec uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) &
pids+=($!)

# vite directly, not `pnpm dev`: the pnpm launcher detaches into its own session,
# which would escape the process group above and leave vite running after Ctrl+C.
(cd "$root/frontend" && exec node_modules/.bin/vite) &
pids+=($!)

echo "dev.sh: backend http://127.0.0.1:8000  frontend http://127.0.0.1:5173"

# Poll rather than `wait -n`: bash defers trap handlers until a blocking `wait -n`
# returns, so SIGTERM would hang here. `sleep` is interruptible, so the trap runs.
while [[ "$(jobs -pr | wc -l)" -eq "${#pids[@]}" ]]; do
  sleep 1
done

# One side exited. Report its status; the EXIT trap stops the other.
running="$(jobs -pr)"
status=0
for pid in "${pids[@]}"; do
  if ! grep -qx "$pid" <<<"$running"; then
    wait "$pid" || status=$?
  fi
done
exit "$status"
