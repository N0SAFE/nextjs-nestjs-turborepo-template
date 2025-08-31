#!/bin/sh
set -e

if [ -z "$SKIP_MIGRATIONS" ]; then
  if [ -f apps/api/package.json ]; then
    echo 'Found apps/api/package.json - running migrations'
    bun run --cwd apps/api db:migrate || echo 'db:migrate failed (continuing)'
  else
    echo 'apps/api/package.json missing even after restore, skipping migrations'
  fi
else
  echo 'SKIP_MIGRATIONS set, skipping migrations'
fi

exec /usr/bin/supervisord -c /etc/supervisord.conf
