# TypeScript application

Use Node 24 and TypeScript for application, tooling and tests. Frontend is plain
Vue 3, Vue Router and CSS. NestJS serves `/api` and the Vite build through
ServeStaticModule. Keep one application process, origin and image.

Use real PostgreSQL with TypeORM. Schema changes are explicit migrations in
`backend/migrations`; never use SQLite or `synchronize: true`. Production and CI
provide DATABASE_URL. Docker Compose is for the local development database.
Keep controllers thin, business logic in services and shared contracts in
`shared/`. Follow [ADR 0001](docs/architecture/0001-one-typescript-application.md)
and the [testing policy](docs/testing-policy.md).

Run `npm run lint` and `npm test` before finishing. `npm run format` writes;
lint only checks. Tests use real HTTP, PostgreSQL and Chromium. Browser flows
cover create, filter, status changes, delete, invalid/cancelled forms, reload
persistence, errors and mobile layout. Process tests cover migrations, restart
persistence and failed-build recovery. CI enables browser E2E (`run_e2e: true`).

No login is configured; denied-access scenarios become required when adding
access control. Localhost is the default bind address. Before public launch,
review authentication, operator/privacy information, backups, DNS and HTTPS.
Use the Startup CLI for infrastructure, deployment and secrets. Never deploy
without owner authorization. Local tests do not prove a production deployment.
