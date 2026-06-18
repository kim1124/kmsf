import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const repoRoot = path.resolve(packageRoot, "../..");
const tmpRoot = "/private/tmp";
const npmCache = path.join(tmpRoot, "kmsf-npm-cache");
const keepTmp = process.env.KMSF_SMOKE_KEEP_TMP === "1";

let packDir;
let workDir;
let devServer;
let success = false;

function buildEnv(extraEnv = {}) {
  return {
    ...process.env,
    NO_COLOR: "1",
    npm_config_cache: process.env.npm_config_cache ?? npmCache,
    ...extraEnv,
  };
}

function run(label, command, args, options = {}) {
  const cwd = options.cwd ?? repoRoot;
  const env = buildEnv(options.env);

  console.log(`\n[smoke:kmsf] ${label}`);
  console.log(`[smoke:kmsf] $ ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}`);
  }
}

async function waitForUrl(url, timeoutMs) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.status >= 200 && response.status < 500) {
        return;
      }
      lastError = new Error(`Unexpected status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError?.message ?? "no response"}`);
}

async function startGeneratedAppDevServer(appDir) {
  const args = ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"];

  console.log("\n[smoke:kmsf] start generated app dev server");
  console.log(`[smoke:kmsf] $ npm ${args.join(" ")}`);

  devServer = spawn("npm", args, {
    cwd: appDir,
    env: buildEnv(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });

  devServer.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
  });
  devServer.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  await waitForUrl("http://127.0.0.1:3000", 120_000);
}

async function findPackedTarball(directory) {
  const entries = await readdir(directory);
  const tarballs = entries.filter((entry) => /^create-kmsf-.*\.tgz$/.test(entry)).sort();

  if (tarballs.length !== 1) {
    throw new Error(`Expected one create-kmsf tarball in ${directory}, found ${tarballs.length}.`);
  }

  return path.join(directory, tarballs[0]);
}

async function main() {
  packDir = await mkdtemp(path.join(tmpRoot, "create-kmsf-pack-"));
  workDir = await mkdtemp(path.join(tmpRoot, "create-kmsf-smoke-"));

  run("build create-kmsf", "npm", ["--workspace=create-kmsf", "run", "build"]);
  run("pack local create-kmsf tarball", "npm", [
    "--workspace=create-kmsf",
    "pack",
    "--pack-destination",
    packDir,
  ]);

  const tarballPath = await findPackedTarball(packDir);
  const appName = "kmsf-smoke";
  const cliInstallDir = path.join(workDir, "create-kmsf-cli");
  const appDir = path.join(workDir, appName);
  await mkdir(cliInstallDir, { recursive: true });

  run("install local create-kmsf tarball", "npm", [
    "install",
    "--prefix",
    cliInstallDir,
    tarballPath,
  ]);

  run("generate KMSF app from local tarball", path.join(
    cliInstallDir,
    "node_modules",
    ".bin",
    "create-kmsf",
  ), [
    appName,
    "--auth=local-json",
    "--layout=top,left,footer",
    "--no-i18n",
    "--no-packages",
    "--no-install",
    "--no-git",
    "--no-playwright",
    "--silent",
  ], {
    cwd: workDir,
  });

  run("install generated app dependencies", "npm", ["install"], { cwd: appDir });
  run("install Playwright browser dependencies", "npx", ["playwright", "install"], { cwd: appDir });
  run("lint generated app", "npm", ["run", "lint"], { cwd: appDir });
  run("run generated app unit tests", "npm", ["run", "test:run"], { cwd: appDir });
  run("build generated app", "npm", ["run", "build"], { cwd: appDir });
  await startGeneratedAppDevServer(appDir);
  run("run generated app layout e2e smoke", "npm", [
    "run",
    "test:e2e",
    "--",
    "tests/e2e/layout-shell.spec.ts",
  ], {
    cwd: appDir,
    env: {
      PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3000",
      PLAYWRIGHT_SKIP_WEBSERVER: "1",
    },
  });

  success = true;
  console.log("\n[smoke:kmsf] completed successfully");
}

try {
  await main();
} finally {
  if (devServer) {
    devServer.kill("SIGTERM");
  }

  if (success && !keepTmp) {
    await Promise.all([
      packDir ? rm(packDir, { recursive: true, force: true }) : undefined,
      workDir ? rm(workDir, { recursive: true, force: true }) : undefined,
    ]);
  } else if (!success) {
    console.error("\n[smoke:kmsf] failed");
    if (packDir) {
      console.error(`[smoke:kmsf] pack dir: ${packDir}`);
    }
    if (workDir) {
      console.error(`[smoke:kmsf] work dir: ${workDir}`);
    }
  }
}
