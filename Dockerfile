FROM node:22.23.2-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
ENV HUSKY=0
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.21.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG API_INTERNAL_URL=http://backend:4000/api/v1
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
RUN test -n "$NEXT_PUBLIC_APP_URL" && test -n "$NEXT_PUBLIC_API_BASE_URL" && pnpm build

FROM node:22.23.2-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
