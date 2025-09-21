#!/bin/sh
set -e

if [ -z "$SKIP_MIGRATIONS" ]; then
  if [ -f apps/api/package.json ]; then
    echo 'Found apps/api/package.json - running migrations'
    bun run --cwd apps/api db:migrate || echo 'db:migrate failed (continuing)'
    
    echo 'Running database seeding (if not already seeded)'
    bun run --cwd apps/api db:seed || echo 'db:seed failed (continuing)'
  else
    echo 'apps/api/package.json missing even after restore, skipping migrations and seeding'
  fi
else
  echo 'SKIP_MIGRATIONS set, skipping migrations and seeding'
fi

exec /usr/bin/supervisord -c /etc/supervisord.conf
