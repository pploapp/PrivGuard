FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.14.0 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/engine/package.json ./packages/engine/
COPY packages/consent-portal/package.json ./packages/consent-portal/
COPY tsconfig.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @privguard/engine build && pnpm --filter @privguard/api build

FROM node:20-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.14.0 --activate
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/node_modules ./packages/api/node_modules
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/main.js"]