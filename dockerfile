# ----------------------------------------------------
# 1. مرحله نصب پکیج‌ها (Dependencies)
# ----------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ----------------------------------------------------
# 2. مرحله بیلد (Builder)
# ----------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# نکته: متغیرهایی که با NEXT_PUBLIC_ شروع میشن باید موقع بیلد مشخص باشن
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ----------------------------------------------------
# 3. مرحله ران‌تایم نهایی (Runner)
# ----------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# امنیت: اجرای کانتینر با کاربر غیر روت
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# کپی کردن فایل‌های استاتیک و خروجی standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]