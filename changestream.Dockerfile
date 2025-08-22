FROM node:lts-alpine AS base
WORKDIR /usr/src/app
RUN npm install -g pnpm@9.5.0

FROM base AS builder
WORKDIR /usr/src/app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

COPY apps/change-stream/package.json ./apps/change-stream/
COPY packages/biomejs/package.json ./packages/biomejs/
COPY packages/clickhouse/package.json ./packages/clickhouse/
COPY packages/mongodb/package.json ./packages/mongodb/
COPY packages/redis/package.json ./packages/redis/

RUN pnpm install --frozen-lockfile
COPY . .

RUN pnpm --filter @data-lake/change-stream... build

RUN pnpm prune --prod

RUN pnpm deploy --filter=@data-lake/change-stream --prod --shamefully-hoist /prod/change-stream


FROM node:lts-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

USER node

COPY --from=builder --chown=node:node /prod/change-stream/dist ./dist
COPY --from=builder --chown=node:node /prod/change-stream/package.json ./package.json
COPY --from=builder --chown=node:node /prod/change-stream/node_modules ./node_modules


CMD ["node", "dist/index.js"]