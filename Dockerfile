FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_APP_URL=https://nexusdigitalbridge.it
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=/app/uploads
# Runtime env da passare con --env-file o -e:
#   DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL,
#   SMTP_HOST, SMTP_PORT, MAIL_FROM, ADMIN_EMAIL,
#   LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, UPLOAD_DIR
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
VOLUME ["/app/uploads"]
EXPOSE 3000
CMD ["node", "server.js"]
