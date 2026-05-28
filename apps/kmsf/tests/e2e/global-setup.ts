import { cleanupCodexLocalAuthDb, cleanupCodexSetupConfig } from "./utils/local-auth-db";

export default async function globalSetup() {
  await cleanupCodexLocalAuthDb();
  await cleanupCodexSetupConfig();
}
