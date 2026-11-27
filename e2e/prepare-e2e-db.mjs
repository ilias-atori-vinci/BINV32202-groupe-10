import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = resolve(repositoryRoot, "backend", "data", "e2e.db");

for (const file of [
  databasePath,
  `${databasePath}-wal`,
  `${databasePath}-shm`,
  `${databasePath}-journal`,
]) {
  rmSync(file, { force: true });
}

const npmCli = process.env.npm_execpath;
const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
const argumentsToRun = npmCli
  ? [npmCli, "run", "db:init", "-w", "backend"]
  : ["run", "db:init", "-w", "backend"];

const initialization = spawnSync(
  command,
  argumentsToRun,
  {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      API_PORT: "3000",
      DATABASE_PATH: "data/e2e.db",
      DEMO_AUTH_ENABLED: "true",
      JWT_SECRET: "playwright-e2e-secret-key-minimum-32-characters",
      NODE_ENV: "test",
    },
    stdio: "inherit",
  },
);

if (initialization.error) throw initialization.error;
if (initialization.status !== 0) {
  throw new Error(`Initialisation de la base E2E échouée (${initialization.status}).`);
}
