#!/bin/sh
set -e

if [ -n "${DOPPLER_TOKEN:-}" ]; then
  if ! command -v doppler >/dev/null 2>&1; then
    echo "DOPPLER_TOKEN is set but doppler CLI is not installed" >&2
    exit 127
  fi

  exec doppler run -- "$@"
fi

exec "$@"
