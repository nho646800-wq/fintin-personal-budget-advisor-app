#!/usr/bin/env bash
# Free port 3000 from any leftover Next.js process, then start the local
# dev server. Keeps development on http://localhost:3000 only — no tunnels.
set -euo pipefail

cd "$(dirname "$0")/.."

free_port_3000() {
  # Linux: fuser can signal whatever owns the TCP port.
  if command -v fuser >/dev/null 2>&1; then
    fuser -k 3000/tcp >/dev/null 2>&1 || true
  fi

  # macOS / general: kill LISTEN owners reported by lsof.
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -nP -iTCP:3000 -sTCP:LISTEN -t 2>/dev/null || true)"
    if [ -n "${pids}" ]; then
      # shellcheck disable=SC2086
      kill -9 ${pids} >/dev/null 2>&1 || true
    fi
  fi

  # Belt-and-suspenders: orphaned Next process trees sometimes linger.
  pkill -9 -f 'next-server' >/dev/null 2>&1 || true
  pkill -9 -f 'next dev' >/dev/null 2>&1 || true

  # Give the OS a moment to release :::3000 / 0.0.0.0:3000.
  sleep 1
}

free_port_3000
exec npx next dev --port 3000
