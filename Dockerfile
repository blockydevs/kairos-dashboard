FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

FROM base AS prod

RUN mkdir /app
COPY pnpm-lock.yaml /app
WORKDIR /app
RUN pnpm fetch --prod

COPY . /app
RUN pnpm install next
RUN pnpm run build

FROM base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
COPY ./package.json /app/package.json
COPY --from=prod /app/node_modules /app/node_modules
COPY --from=prod /app/.next /app/.next
EXPOSE 3000
CMD [ "pnpm", "start" ]
