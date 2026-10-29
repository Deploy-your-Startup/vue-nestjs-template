# Deployment

Use `startup` for Vault, Ansible, provisioning, deployment and template updates.
Bootstrap fills the project-specific inventory and rotates the public template
Vault baseline. Never deploy directly from a template checkout.

PostgreSQL uses the shared role. The application role deploys one backend image
containing NestJS and the Vue build, with one service and one site ingress.
All resources use `k8s_namespace`. Existing shared clusters keep infrastructure
operations with the cluster owner; attached applications deploy services only.

Local generation and tests do not provision or deploy. Before a public launch,
review access control and legal/privacy details, configure production secrets
through the CLI, then verify backups, Actions, DNS and HTTPS.
