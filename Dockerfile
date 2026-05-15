FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl \
      ca-certificates \
      python3 \
      make \
      g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install --no-audit --no-fund; fi

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
EXPOSE 8080
CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && npx next start -H 0.0.0.0 -p ${PORT:-8080}"]
