FROM node:lts-alpine AS base
WORKDIR /usr/src/app
RUN npm install -g pnpm@9.5.0

FROM base AS builder
WORKDIR /usr/src/app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

COPY apps/backend/package.json ./apps/backend/
COPY packages/biomejs/package.json ./packages/biomejs/
COPY packages/clickhouse/package.json ./packages/clickhouse/
COPY packages/mongodb/package.json ./packages/mongodb/
COPY packages/redis/package.json ./packages/redis/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @data-lake/backend... build

RUN pnpm prune --prod

RUN pnpm deploy --filter=@data-lake/backend --prod --shamefully-hoist /prod/backend

FROM node:lts-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

USER node

COPY --from=builder --chown=node:node /prod/backend/dist ./dist
COPY --from=builder --chown=node:node /prod/backend/package.json ./package.json
COPY --from=builder --chown=node:node /prod/backend/node_modules ./node_modules

EXPOSE 3333

CMD ["node", "dist/server.js"]
