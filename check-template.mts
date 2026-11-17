import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

process.env.PATH = `${dirname(process.execPath)}:${process.env.PATH}`;

const destination = mkdtempSync(join(tmpdir(), "vue-nestjs-template-"));

function run(command: string, args: string[], cwd = destination): void {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed`);
}

try {
  run("uvx", [
    "--from",
    "copier==9.18.2",
    "copier",
    "copy",
    "--defaults",
    "--vcs-ref",
    "HEAD",
    "--data",
    "project_name=template-check",
    "--data",
    "display_name=Template Check",
    "--data",
    "k8s_namespace=template-check",
    import.meta.dirname,
    destination,
  ]);
  run("python3", [join(import.meta.dirname, "tests/deployment_version_check.py"), destination]);
  // GIVEN a rendered deployment, WHEN its locked CLI loads safe-access commands,
  // THEN the credential-protection runtime is present independently of global startup.
  for (const command of ["inspect", "rotate-client-ca"]) {
    run("uv", ["run", "--locked", "--project", join(destination, "deployment"), "startup", "cluster", command, "--help"]);
  }
  const manifest = JSON.parse(
    readFileSync(join(destination, "package.json"), "utf8"),
  ) as { name: string };
  assert.equal(manifest.name, "template-check");
  assert.match(
    readFileSync(join(destination, "frontend/index.html"), "utf8"),
    /Template Check/,
  );
  assert.match(
    readFileSync(join(destination, "frontend/src/App.vue"), "utf8"),
    /Template Check/,
  );
  assert.match(readFileSync(join(destination, "deployment/group_vars/all.yml"), "utf8"), /k8s_namespace: "template-check"/);
  // Rendered GitHub expressions must survive Copier and isolate PR cancellation.
  const workflow = readFileSync(join(destination, ".github/workflows/build-and-deploy-backend.yml"), "utf8");
  assert.ok(workflow.includes("github.event.pull_request.number || github.run_id"));
  assert.ok(workflow.includes("cancel-in-progress: ${{ github.event_name == 'pull_request' }}"));
  // The shared build lives under another owner, so the caller grants what it nests.
  assert.ok(workflow.includes("      id-token: write\n"));
  run("npm", ["ci"]);
  run("npm", ["run", "lint"]);
  if (!process.argv.includes("--lint-only")) {
    run("npx", ["playwright", "install", "chromium"]);
    run("npm", ["test"]);
  }
  console.log(
    "Template generation, lint, HTTP integration, restart persistence and browser E2E passed.",
  );
} finally {
  rmSync(destination, { recursive: true, force: true });
}
