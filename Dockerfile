FROM node:20-slim

# Chromium + 运行依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 构建时生成 prisma client + next build
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
# 让 puppeteer 用系统 chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

EXPOSE 3000

# 启动时部署迁移，再启动服务
CMD ["sh", "-lc", "npx prisma migrate deploy && npm run start"]
