#!/usr/bin/env bash
set -euo pipefail

if ! command -v bunx >/dev/null 2>&1; then
  echo "Error: bunx is required but not found on PATH." >&2
  exit 1
fi

has_session_flag="false"
for arg in "$@"; do
  case "$arg" in
    --session|--session=*|-s|-s=*)
      has_session_flag="true"
      break
      ;;
  esac
done

cmd=(bunx @playwright/cli@latest)
if [[ "${has_session_flag}" != "true" && -n "${PLAYWRIGHT_CLI_SESSION:-}" ]]; then
  cmd+=("-s=${PLAYWRIGHT_CLI_SESSION}")
fi
cmd+=("$@")

exec "${cmd[@]}"
