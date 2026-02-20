#!/bin/sh
set -e

echo "[init] NODE_ENV=$NODE_ENV"
echo "[init] DATABASE_URL is set? ${DATABASE_URL:+yes}"

# 只在第一次初始化时跑（通过标记文件避免每次启动都重建）
MARKER="/app/.db-initialized"

if [ ! -f "$MARKER" ]; then
  echo "[init] First boot: prisma generate + db push (bootstrap schema)"
  npx prisma generate
  npx prisma db push
  touch "$MARKER"
  echo "[init] Bootstrap done."
else
  echo "[init] Already initialized, skip db push."
fi

echo "[init] Start app..."
exec npm run start
