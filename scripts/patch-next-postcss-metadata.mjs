import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const nextPackagePath = join(process.cwd(), "node_modules", "next", "package.json");
const nodeModulesLockPath = join(process.cwd(), "node_modules", ".package-lock.json");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

try {
  const packageJson = await readJson(nextPackagePath);

  if (packageJson.version === "16.2.6" && packageJson.dependencies?.postcss === "8.4.31") {
    packageJson.dependencies.postcss = "8.5.14";
    await writeJson(nextPackagePath, packageJson);
  }

  const nodeModulesLock = await readJson(nodeModulesLockPath);
  const nextLock = nodeModulesLock.packages?.["node_modules/next"];

  if (nextLock?.version === "16.2.6" && nextLock.dependencies?.postcss === "8.4.31") {
    nextLock.dependencies.postcss = "8.5.14";
    await writeJson(nodeModulesLockPath, nodeModulesLock);
  }
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    process.exit(0);
  }

  throw error;
}
