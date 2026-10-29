# Vue + NestJS template

This repository owns the reusable Copier application in `template/`.
Use Node 24 and TypeScript for application, tooling and tests. Keep plain Vue 3,
NestJS static serving and PostgreSQL with TypeORM migrations. One application
image serves API and frontend. Never substitute SQLite in application tests.

Run `mise run lint` and `mise run test` before completion. The test task renders
an independent project, runs real PostgreSQL HTTP and browser scenarios, and
checks migration/restart behavior. Keep all database test data isolated.
Template fixes belong here, not only in generated applications.
Use feature branches and pull requests for changes, Conventional Commits and
normal merges. Never deploy, provision, change clusters or publish secrets as
part of a template check. Local checks do not establish a successful deployment.
