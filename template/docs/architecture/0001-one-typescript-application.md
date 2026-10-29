# 0001 — One TypeScript application with PostgreSQL

Vue 3 and NestJS share contracts in one repository. Vite emits `dist/frontend`;
TypeScript emits `dist/backend` and `dist/shared`. Nest's ServeStaticModule serves
assets and client-side routes. `/api` and missing assets retain HTTP 404s.
The backend image contains both API and frontend; no separate frontend image,
service or deployment is needed. Vue uses native controls, a native dialog,
regular CSS and typed fetch, without Nuxt or a component framework.

PostgreSQL is the only application database, matching the other full-stack
Factory templates. TypeORM keeps controllers thin and application services
explicit. Schema synchronization is disabled. Versioned migrations run before
Nest starts, serialized with a PostgreSQL advisory lock, and are transactional.
The development database uses Docker Compose and a named volume. CI and
production supply DATABASE_URL; tests never start the development Compose stack.
Each test context uses its own schema on a real disposable PostgreSQL server.

Demo data is opt-in and guarded by a transactional one-time marker. It never
reappears after deletion, survives process restarts and remains disabled by
default in production. Authentication is not included in this starting point.
