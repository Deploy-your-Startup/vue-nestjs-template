# Vue + NestJS application template

Build a TypeScript startup with plain Vue 3, NestJS and PostgreSQL 18. NestJS
serves the Vite build with `@nestjs/serve-static`: one origin, one application
process and one application image, alongside PostgreSQL. No Nuxt or UI framework.

## Run locally

Requires Node 24, Docker and uv (for Copier):

```sh
uvx --from copier==9.18.2 copier copy --defaults \
  --data project_name=my-startup --data display_name='My Startup' \
  . ../my-startup
cd ../my-startup
npm ci
npm run db:up
npm run build
SEED_DEMO=true npm start
```

Open http://localhost:3100. `npm run dev` rebuilds and restarts the same Nest
process on source changes; reload the browser to see frontend changes.
The database uses a named Docker volume and binds localhost port 55440. Set
`POSTGRES_PORT` and `DATABASE_URL` together if you choose another database port.
Production and CI provide `DATABASE_URL` and never start a development database.
Schema changes use explicit TypeORM migrations; `synchronize` is disabled.
The opt-in example data seeds once, even after all example tasks are deleted.

## Checks

`mise run lint` renders a fresh project and checks formatting and TypeScript.
`mise run test` also runs HTTP integration and Chromium E2E tests against real
PostgreSQL, with isolated schemas and cleanup. No SQLite or mocked database is
used. Tests cover CRUD, validation, filtering, mobile layout, errors, migrations,
process restarts and recovery from a failed development build.

Generated projects expose `./make.sh format`, `./make.sh lint`, `./make.sh test`
and the equivalent npm/mise tasks. Test runs use a disposable PostgreSQL
container unless `TEST_DATABASE_URL` or `DATABASE_URL` supplies an existing
server. Tests create and remove only their own randomly named schemas.

## Startup Factory

Register this repository as `vue-nestjs-template` under Factory tooling. The CLI
integration adds **Vue + NestJS** to `startup bootstrap`; use a tested immutable
revision until a tagged template release is available:

```sh
startup bootstrap --kind fullstack \
  --template https://github.com/Deploy-your-Startup/vue-nestjs-template.git \
  --template-version <reviewed-commit>
```

Bootstrap creates infrastructure and deploys; use Copier above for a local-only
startup. Deployment follows the shared PostgreSQL, Vault, namespace and service
workflow contracts. Only the `backend` application service is built and deployed;
it contains both NestJS and Vue. Browser E2E remains enabled in CI (`run_e2e: true`).
Existing clusters use the standard `--cluster` descriptor flow. Application
updates use `startup template update`; shared roles use `startup sync`.

This template has no login or analytics. Before public launch, add the required
access control, review operator/privacy details and verify backups, DNS and
HTTPS. Local checks do not establish a successful production deployment.
