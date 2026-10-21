ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS build

ARG SERVICE

RUN : "${SERVICE:?SERVICE build argument is required}"

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY services/${SERVICE}/package.json ./services/${SERVICE}/
COPY services/shared/package.json ./services/shared/
COPY tsconfig.json /workspace/tsconfig.json
COPY .delivery/configuration/typescript/shared.tsconfig.json /workspace/.delivery/configuration/typescript/shared.tsconfig.json
COPY services/shared/src/ /workspace/services/shared/src/

RUN npm ci --workspace="${SERVICE}" --include-workspace-root

WORKDIR /app

COPY tsconfig.json ./
COPY .delivery/configuration/docker/docker.tsconfig.json ./.delivery/configuration/docker/
COPY services/${SERVICE}/src/ ./src/

RUN cp "/workspace/services/${SERVICE}/package.json" ./package.json \
    && ln -s /workspace/node_modules ./node_modules \
    && ./node_modules/.bin/tsc -b /workspace/.delivery/configuration/typescript/shared.tsconfig.json \
    && ./node_modules/.bin/tsc -b .delivery/configuration/docker/docker.tsconfig.json

RUN npm prune --prefix=/workspace --omit=dev --workspace="${SERVICE}" --include-workspace-root \
    && unlink "/workspace/node_modules/${SERVICE}"

FROM ${NODE_IMAGE} AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /workspace/node_modules/ ./node_modules/
COPY --from=build /workspace/services/shared/ ./services/shared/
COPY --from=build /app/dist/ ./dist/

USER node

CMD ["node", "dist/index.js"]
