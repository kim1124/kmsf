import type { AppRole } from "@/lib/auth/roles";
import { readProjectSetupConfig } from "@/lib/setup/project-setup-config";

type KmsfManagedAccountInput = {
  displayName?: string;
  email: string;
  level?: number;
  password: string;
  role: AppRole;
  username: string;
};

type KmsfManagedAccountUpdateInput = {
  displayName?: string;
  email?: string;
  password?: string;
  username?: string;
};

async function shouldUseSqliteStore() {
  const setupConfig = await readProjectSetupConfig();

  return setupConfig?.dbMode === "sqlite";
}

export async function createKmsfManagedAccount(input: KmsfManagedAccountInput) {
  if (await shouldUseSqliteStore()) {
    const { createSqliteAccount } = await import("@/lib/auth/providers/sqlite-auth-store");

    return createSqliteAccount(input);
  }

  const { createLocalJsonAccount } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );

  return createLocalJsonAccount(input);
}

export async function findKmsfManagedAccountById(id: string) {
  if (await shouldUseSqliteStore()) {
    const { findSqliteAccountById } = await import("@/lib/auth/providers/sqlite-auth-store");

    return findSqliteAccountById(id);
  }

  const { findLocalJsonAccountById } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );

  return findLocalJsonAccountById(id);
}

export async function updateKmsfManagedAccount(
  id: string,
  input: KmsfManagedAccountUpdateInput,
) {
  if (await shouldUseSqliteStore()) {
    const { updateSqliteAccount } = await import("@/lib/auth/providers/sqlite-auth-store");

    return updateSqliteAccount(id, input);
  }

  const { updateLocalJsonAccount } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );

  return updateLocalJsonAccount(id, input);
}

export async function hasKmsfManagedAccounts() {
  if (await shouldUseSqliteStore()) {
    const { hasSqliteAccounts } = await import("@/lib/auth/providers/sqlite-auth-store");

    return hasSqliteAccounts();
  }

  const { hasLocalJsonAccounts } = await import("@/lib/auth/providers/local-json-auth-store");

  return hasLocalJsonAccounts();
}

export async function listKmsfManagedAccounts() {
  if (await shouldUseSqliteStore()) {
    const { listSqliteAccounts } = await import("@/lib/auth/providers/sqlite-auth-store");

    return listSqliteAccounts();
  }

  const { listLocalJsonAccounts } = await import("@/lib/auth/providers/local-json-auth-store");

  return listLocalJsonAccounts();
}

export async function readKmsfManagedAuthStoreSnapshot() {
  if (await shouldUseSqliteStore()) {
    const { readSqliteAuthStoreSnapshot } = await import(
      "@/lib/auth/providers/sqlite-auth-store"
    );

    return readSqliteAuthStoreSnapshot();
  }

  const { readLocalJsonAuthStoreSnapshot } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );
  const snapshot = await readLocalJsonAuthStoreSnapshot();

  return {
    ...snapshot,
    provider: "local-json" as const,
  };
}

export async function verifyKmsfManagedCredentials(identifier: string, password: string) {
  if (await shouldUseSqliteStore()) {
    const { verifySqliteCredentials } = await import("@/lib/auth/providers/sqlite-auth-store");

    return verifySqliteCredentials(identifier, password);
  }

  const { verifyLocalJsonCredentials } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );

  return verifyLocalJsonCredentials(identifier, password);
}

export async function verifyKmsfManagedAccountPassword(id: string, password: string) {
  if (await shouldUseSqliteStore()) {
    const { verifySqliteAccountPassword } = await import(
      "@/lib/auth/providers/sqlite-auth-store"
    );

    return verifySqliteAccountPassword(id, password);
  }

  const { verifyLocalJsonAccountPassword } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );

  return verifyLocalJsonAccountPassword(id, password);
}

export async function resetKmsfManagedAuthStore() {
  if (await shouldUseSqliteStore()) {
    const { resetSqliteAuthStore } = await import("@/lib/auth/providers/sqlite-auth-store");

    return resetSqliteAuthStore();
  }

  const { resetLocalJsonAuthStore } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );

  return resetLocalJsonAuthStore();
}

export async function deleteKmsfManagedAccount(id: string) {
  if (await shouldUseSqliteStore()) {
    const { deleteSqliteAccount } = await import("@/lib/auth/providers/sqlite-auth-store");

    return deleteSqliteAccount(id);
  }

  const { deleteLocalJsonAccount } = await import("@/lib/auth/providers/local-json-auth-store");

  return deleteLocalJsonAccount(id);
}
