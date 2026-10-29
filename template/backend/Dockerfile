# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=application /package.json /package-lock.json ./
RUN npm ci
COPY --from=application /backend ./backend
COPY --from=application /frontend ./frontend
COPY --from=application /shared ./shared
COPY --from=application /scripts ./scripts
COPY --from=application /tests ./tests
COPY --from=application /docs ./docs
COPY --from=application /tsconfig.backend.json /tsconfig.frontend.json /tsconfig.tools.json /vite.config.mts /playwright.config.ts /make.sh /.prettierrc.json /.prettierignore ./
RUN npm run build

FROM build AS test
RUN npx playwright install --with-deps chromium && mkdir -p /reports
CMD ["./make.sh", "test"]

FROM build AS production-dependencies
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3100
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:3100/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node dist/backend/migrate.js && exec node dist/backend/main.js"]
