#!/bin/sh
set -e

echo "[init] DATABASE_URL is set? ${DATABASE_URL:+yes}"

mkdir -p /app/.automation-profiles
MARKER="/app/.automation-profiles/.db-initialized"

# 如果 marker 不存在就 db push；如果 marker 存在也检查一下能否查询表
if [ ! -f "$MARKER" ]; then
  echo "[init] First boot: prisma generate + db push"
  npx prisma generate
  npx prisma db push
  touch "$MARKER"
else
  echo "[init] Marker exists, skip db push."
fi

PORT_NUM="${WEB_PORT:-${PORT:-3000}}"
echo "[init] Using port: $PORT_NUM"
exec npx next start -p "$PORT_NUM"
