ARG NODE_VERSION=22.12.0
ARG NODE_IMAGE=public.ecr.aws/docker/library/node

FROM ${NODE_IMAGE}:${NODE_VERSION} AS base

WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y git python3 make g++ && npm install -g pnpm@10.32.1

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .

RUN pnpm build
RUN pnpm prune --prod

FROM base AS final

ENV NODE_ENV=production

COPY package.json .
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

USER node

CMD ["node", "dist/index.js"]
