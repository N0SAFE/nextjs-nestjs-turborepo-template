#!/bin/sh
set -e

echo '=== BOOTSTRAP START ==='
date || true
echo "User: $(whoami)"
echo "UID: $(id -u)"
echo "GID: $(id -g)"
echo "PWD: $(pwd)"
echo "NODE_ENV=$NODE_ENV"
echo '--- Memory Info ---'
cat /proc/meminfo | head -n 5 || true
echo '--------------------'

echo '--- /app ---'
ls -al /app || true
echo '--- /app/apps ---'
ls -al /app/apps || true
echo '--- /app/apps/api (top level) ---'
ls -al /app/apps/api || true

# Fallback restore if bind mount is empty (no files) or missing package.json
FILE_COUNT=$(ls -1 /app/apps/api 2>/dev/null | wc -l || echo 0)
if [ "$FILE_COUNT" -lt 3 ] || [ ! -f /app/apps/api/package.json ]; then
  echo "[fallback] Detected empty or missing api sources (count=$FILE_COUNT, package.json present? $( [ -f /app/apps/api/package.json ] && echo yes || echo no )). Restoring from image backup."
  if [ -d /app_image/apps/api ]; then
    cp -R /app_image/apps/api/. /app/apps/api/
    echo '[fallback] Restore complete. Listing restored top level:'
    ls -al /app/apps/api | head -n 60 || true
  else
    echo '[fallback] ERROR: backup directory /app_image/apps/api not found.'
  fi
else
  echo '[fallback] Source directory appears populated; no restore needed.'
fi

echo '--- /app/apps/api/src sample (first 80 entries) ---'
if [ -d /app/apps/api/src ]; then ls -al /app/apps/api/src | head -n 80; else echo 'src missing'; fi

echo '--- locate key source files ---'
for f in apps/api/src/main.ts apps/api/src/app.module.ts apps/api/src/auth.ts; do
  if [ -f "$f" ]; then echo "FOUND $f"; else echo "MISSING $f"; fi
done

echo 'Running container bootstrap'
if [ -z "$SKIP_MIGRATIONS" ]; then
  # Basic memory guard: skip migrations if total memory < 350MB (common low limit)
  TOTAL_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}' || echo 0)
  if [ "$TOTAL_KB" -lt 350000 ]; then
    echo "[migrations] Detected low memory (${TOTAL_KB} kB); setting SKIP_MIGRATIONS to prevent ENOMEM"
    SKIP_MIGRATIONS=1
  fi
fi

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

echo 'TypeScript will create the dist directory as needed'
ls -al apps/api/ | grep dist || echo 'No dist directory yet - will be created by TypeScript'
echo '--- dist file sample (first 40) ---'
find apps/api/dist -maxdepth 2 -type f 2>/dev/null | head -n 40 || true

echo '=== BOOTSTRAP END (starting supervisord) ==='
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
