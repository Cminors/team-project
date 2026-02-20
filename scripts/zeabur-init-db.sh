#!/bin/sh
set -e

echo "[init] DATABASE_URL is set? ${DATABASE_URL:+yes}"

MARKER="/app/.automation-profiles/.db-initialized"

# 确保目录存在（即使第一次启动也能创建）
mkdir -p /app/.automation-profiles

if [ ! -f "$MARKER" ]; then
  echo "[init] First boot: prisma generate + db push"
  npx prisma generate
  npx prisma db push
  touch "$MARKER"
  echo "[init] Bootstrap done."
else
  echo "[init] Already initialized, skip db push."
fi

exec npm run start
