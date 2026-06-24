import { beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => {
  const appendLocalAudit = vi.fn();
  const appendSupabaseAudit = vi.fn();
  const clearAppSessionCookie = vi.fn();
  const clearLocalJsonSessionCookie = vi.fn();
  const clearProjectSetupConfig = vi.fn();
  const createLocalBackup = vi.fn();
  const deleteUser = vi.fn();
  const deleteLocalJsonAccount = vi.fn();
  const getCurrentUser = vi.fn();
  const isSupabaseConfigured = vi.fn();
  const hasSupabaseSecretKey = vi.fn();
  const insertSupabaseBackup = vi.fn();
  const listLocalJsonAccounts = vi.fn();
  const listAllSupabaseAuthUsers = vi.fn();
  const managerSelect = vi.fn();
  const managerFrom = vi.fn(() => ({ select: managerSelect }));
  const readKmsfManagedAuthStoreSnapshot = vi.fn();
  const readLocalJsonAuthStoreSnapshot = vi.fn();
  const redirect = vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
  const resetLocalJsonAuthStore = vi.fn();
  const resetRuntimeAuthProviderCache = vi.fn();
  const resetSupabaseFactorySystem = vi.fn();
  const resolveRuntimeAuthProvider = vi.fn();
  const signOut = vi.fn();
  const verifyCsrfToken = vi.fn();
  const verifyLocalJsonAccountPassword = vi.fn();
  const verifySupabaseAccountPassword = vi.fn();

  return {
    appendLocalAudit,
    appendSupabaseAudit,
    clearAppSessionCookie,
    clearLocalJsonSessionCookie,
    clearProjectSetupConfig,
    createLocalBackup,
    deleteLocalJsonAccount,
    deleteUser,
    getCurrentUser,
    hasSupabaseSecretKey,
    insertSupabaseBackup,
    isSupabaseConfigured,
    listAllSupabaseAuthUsers,
    listLocalJsonAccounts,
    managerFrom,
    managerSelect,
    readKmsfManagedAuthStoreSnapshot,
    readLocalJsonAuthStoreSnapshot,
    redirect,
    resetLocalJsonAuthStore,
    resetRuntimeAuthProviderCache,
    resetSupabaseFactorySystem,
    resolveRuntimeAuthProvider,
    signOut,
    verifyCsrfToken,
    verifyLocalJsonAccountPassword,
    verifySupabaseAccountPassword,
  };
});

vi.mock("next/navigation", () => ({
  redirect: actionMocks.redirect,
}));

vi.mock("@/lib/auth/app-session.server", () => ({
  clearAppSessionCookie: actionMocks.clearAppSessionCookie,
}));

vi.mock("@/lib/auth/local-session.server", () => ({
  clearLocalJsonSessionCookie: actionMocks.clearLocalJsonSessionCookie,
}));

vi.mock("@/lib/auth/providers/runtime-auth-provider", () => ({
  resetRuntimeAuthProviderCache: actionMocks.resetRuntimeAuthProviderCache,
  resolveRuntimeAuthProvider: actionMocks.resolveRuntimeAuthProvider,
}));

vi.mock("@/lib/auth/providers/local-json-auth-store", () => ({
  deleteLocalJsonAccount: actionMocks.deleteLocalJsonAccount,
  listLocalJsonAccounts: actionMocks.listLocalJsonAccounts,
  readLocalJsonAuthStoreSnapshot: actionMocks.readLocalJsonAuthStoreSnapshot,
  resetLocalJsonAuthStore: actionMocks.resetLocalJsonAuthStore,
  verifyLocalJsonAccountPassword: actionMocks.verifyLocalJsonAccountPassword,
}));

vi.mock("@/lib/auth/providers/kmsf-managed-auth-store", () => ({
  deleteKmsfManagedAccount: actionMocks.deleteLocalJsonAccount,
  listKmsfManagedAccounts: actionMocks.listLocalJsonAccounts,
  readKmsfManagedAuthStoreSnapshot: actionMocks.readKmsfManagedAuthStoreSnapshot,
  resetKmsfManagedAuthStore: actionMocks.resetLocalJsonAuthStore,
  verifyKmsfManagedAccountPassword: actionMocks.verifyLocalJsonAccountPassword,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: actionMocks.getCurrentUser,
}));

vi.mock("@/lib/auth/system-reset-audit.local-json.server", () => ({
  appendLocalSystemResetAuditEvent: actionMocks.appendLocalAudit,
}));

vi.mock("@/lib/auth/system-reset-backup.server", () => ({
  createLocalSystemResetBackup: actionMocks.createLocalBackup,
}));

vi.mock("@/lib/security/csrf", () => ({
  verifyCsrfToken: actionMocks.verifyCsrfToken,
}));

vi.mock("@/lib/setup/project-setup-config", () => ({
  clearProjectSetupConfig: actionMocks.clearProjectSetupConfig,
  readProjectSetupConfig: vi.fn(async () => null),
}));

vi.mock("@/lib/supabase/account-admin", () => ({
  listAllSupabaseAuthUsers: actionMocks.listAllSupabaseAuthUsers,
  resetSupabaseFactorySystem: actionMocks.resetSupabaseFactorySystem,
  verifySupabaseAccountPassword: actionMocks.verifySupabaseAccountPassword,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    auth: {
      admin: {
        deleteUser: actionMocks.deleteUser,
      },
    },
    from: actionMocks.managerFrom,
  }),
}));

vi.mock("@/lib/supabase/env", () => ({
  getAppUrl: () => "http://localhost:3000",
  hasSupabaseSecretKey: actionMocks.hasSupabaseSecretKey,
  isSupabaseConfigured: actionMocks.isSupabaseConfigured,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signOut: actionMocks.signOut,
    },
  })),
}));

vi.mock("@/lib/supabase/system-reset-audit", () => ({
  appendSupabaseSystemResetAuditEvent: actionMocks.appendSupabaseAudit,
  insertSupabaseSystemResetBackup: actionMocks.insertSupabaseBackup,
}));

function buildResetForm(input?: {
  confirmation?: string;
  mode?: string;
  password?: string;
  riskAccepted?: boolean;
}) {
  const formData = new FormData();

  formData.set("confirmation", input?.confirmation ?? "공장초기화");
  formData.set("mode", input?.mode ?? "factory");
  formData.set("password", input?.password ?? "admin-password");

  if (input?.riskAccepted ?? true) {
    formData.set("riskAccepted", "on");
  }

  return formData;
}

function buildDeleteForm(input?: { password?: string }) {
  const formData = new FormData();

  formData.set("password", input?.password ?? "admin-password");

  return formData;
}

describe("resetSystemAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.appendLocalAudit.mockResolvedValue(null);
    actionMocks.appendSupabaseAudit.mockResolvedValue(null);
    actionMocks.clearAppSessionCookie.mockResolvedValue(null);
    actionMocks.clearLocalJsonSessionCookie.mockResolvedValue(null);
    actionMocks.deleteLocalJsonAccount.mockResolvedValue(null);
    actionMocks.deleteUser.mockResolvedValue({ error: null });
    actionMocks.clearProjectSetupConfig.mockResolvedValue(null);
    actionMocks.createLocalBackup.mockResolvedValue({
      ref: "file:/tmp/kmsf-reset-backup.json",
    });
    actionMocks.getCurrentUser.mockResolvedValue({
      authMode: "local-json",
      avatarDataUrl: null,
      avatarInitials: "AD",
      displayName: "admin",
      email: "admin@test.local",
      id: "local_admin",
      isAuthenticated: true,
      level: 3,
      role: "admin",
      username: "admin",
    });
    actionMocks.hasSupabaseSecretKey.mockReturnValue(true);
    actionMocks.isSupabaseConfigured.mockReturnValue(true);
    actionMocks.insertSupabaseBackup.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      ref: "supabase:system_reset_backups:00000000-0000-0000-0000-000000000001",
    });
    actionMocks.listAllSupabaseAuthUsers.mockResolvedValue([
      {
        app_metadata: { level: 3, role: "admin" },
        created_at: "2026-06-05T00:00:00.000Z",
        email: "admin@test.local",
        id: "manager-1",
        last_sign_in_at: null,
        user_metadata: { username: "admin" },
      },
    ]);
    actionMocks.listLocalJsonAccounts.mockResolvedValue([
      {
        createdAt: "2026-06-05T00:00:00.000Z",
        displayName: "admin",
        email: "admin@test.local",
        id: "local_admin",
        lastSignedInAt: null,
        level: 3,
        role: "admin",
        username: "admin",
      },
    ]);
    actionMocks.readLocalJsonAuthStoreSnapshot.mockResolvedValue({
      accounts: [{ id: "local_admin", username: "admin" }],
      loginAttemptStates: [],
      loginAuditEvents: [],
      version: 2,
    });
    actionMocks.readKmsfManagedAuthStoreSnapshot.mockResolvedValue({
      accounts: [{ id: "local_admin", username: "admin" }],
      loginAttemptStates: [],
      loginAuditEvents: [],
      provider: "local-json",
      version: 2,
    });
    actionMocks.managerSelect.mockResolvedValue({
      data: [
        {
          email: "admin@test.local",
          id: "manager-1",
          username: "admin",
        },
      ],
      error: null,
    });
    actionMocks.resetLocalJsonAuthStore.mockResolvedValue(null);
    actionMocks.resetSupabaseFactorySystem.mockResolvedValue(null);
    actionMocks.resolveRuntimeAuthProvider.mockResolvedValue({
      attempts: 0,
      provider: "local-json",
      reason: "explicit-local-json",
    });
    actionMocks.signOut.mockResolvedValue(null);
    actionMocks.verifyCsrfToken.mockResolvedValue(true);
    actionMocks.verifyLocalJsonAccountPassword.mockResolvedValue(true);
    actionMocks.verifySupabaseAccountPassword.mockResolvedValue(true);
  });

  it("requires explicit risk acceptance before reset execution", async () => {
    const { resetSystemAction } = await import("./actions");

    await expect(
      resetSystemAction(buildResetForm({ riskAccepted: false })),
    ).rejects.toThrow("REDIRECT:/settings?section=reset&systemResetError=risk");
    expect(actionMocks.resetLocalJsonAuthStore).not.toHaveBeenCalled();
  });

  it("performs settings reset without deleting local-json accounts", async () => {
    const { resetSystemAction } = await import("./actions");

    await expect(
      resetSystemAction(
        buildResetForm({
          confirmation: "설정초기화",
          mode: "settings",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/sign-in?success=settings-reset");

    expect(actionMocks.clearProjectSetupConfig).toHaveBeenCalledTimes(1);
    expect(actionMocks.resetLocalJsonAuthStore).not.toHaveBeenCalled();
    expect(actionMocks.clearLocalJsonSessionCookie).toHaveBeenCalledTimes(1);
    expect(actionMocks.clearAppSessionCookie).toHaveBeenCalledTimes(1);
    expect(actionMocks.appendLocalAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        backupRef: "file:/tmp/kmsf-reset-backup.json",
        mode: "settings",
        provider: "local-json",
        status: "success",
      }),
    );
  });

  it("backs up and deletes local-json accounts during factory reset", async () => {
    const { resetSystemAction } = await import("./actions");

    await expect(resetSystemAction(buildResetForm())).rejects.toThrow(
      "REDIRECT:/setup/initial-admin?reset=success",
    );

    expect(actionMocks.createLocalBackup).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "factory",
        provider: "local-json",
        snapshot: expect.objectContaining({
          authStore: expect.objectContaining({
            accounts: [{ id: "local_admin", username: "admin" }],
          }),
        }),
      }),
    );
    expect(actionMocks.resetLocalJsonAuthStore).toHaveBeenCalledTimes(1);
    expect(actionMocks.appendLocalAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        backupRef: "file:/tmp/kmsf-reset-backup.json",
        mode: "factory",
        provider: "local-json",
        status: "success",
      }),
    );
  });

  it("backs up the active KMSF-managed auth store during local-provider reset", async () => {
    actionMocks.readKmsfManagedAuthStoreSnapshot.mockResolvedValueOnce({
      accounts: [{ id: "sqlite_admin", username: "admin" }],
      provider: "sqlite",
      version: 1,
    });
    const { resetSystemAction } = await import("./actions");

    await expect(resetSystemAction(buildResetForm())).rejects.toThrow(
      "REDIRECT:/setup/initial-admin?reset=success",
    );

    expect(actionMocks.createLocalBackup).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "factory",
        provider: "local-json",
        snapshot: expect.objectContaining({
          authStore: expect.objectContaining({
            accounts: [{ id: "sqlite_admin", username: "admin" }],
            provider: "sqlite",
          }),
        }),
      }),
    );
    expect(actionMocks.readLocalJsonAuthStoreSnapshot).not.toHaveBeenCalled();
  });

  it("backs up and deletes Supabase accounts during factory reset", async () => {
    actionMocks.getCurrentUser.mockResolvedValueOnce({
      authMode: "supabase",
      avatarDataUrl: null,
      avatarInitials: "AD",
      displayName: "admin",
      email: "admin@test.local",
      id: "manager-1",
      isAuthenticated: true,
      level: 3,
      role: "admin",
      username: "admin",
    });
    actionMocks.resolveRuntimeAuthProvider.mockResolvedValueOnce({
      attempts: 1,
      provider: "supabase",
      reason: "supabase-ready",
    });
    const { resetSystemAction } = await import("./actions");

    await expect(resetSystemAction(buildResetForm())).rejects.toThrow(
      "REDIRECT:/setup/initial-admin?reset=success",
    );

    expect(actionMocks.insertSupabaseBackup).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: expect.objectContaining({
          id: "manager-1",
          username: "admin",
        }),
        mode: "factory",
        provider: "supabase",
        snapshot: expect.objectContaining({
          authUsers: expect.any(Array),
          managerRows: expect.any(Array),
        }),
      }),
    );
    expect(actionMocks.signOut).toHaveBeenCalledTimes(1);
    expect(actionMocks.resetSupabaseFactorySystem).toHaveBeenCalledTimes(1);
    expect(actionMocks.appendSupabaseAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "factory",
        provider: "supabase",
        status: "success",
      }),
    );
  });
});

describe("deleteAccountAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.clearAppSessionCookie.mockResolvedValue(null);
    actionMocks.clearLocalJsonSessionCookie.mockResolvedValue(null);
    actionMocks.getCurrentUser.mockResolvedValue({
      authMode: "local-json",
      avatarDataUrl: null,
      avatarInitials: "AD",
      displayName: "admin",
      email: "admin@test.local",
      id: "local_admin",
      isAuthenticated: true,
      level: 3,
      role: "admin",
      username: "admin",
    });
    actionMocks.hasSupabaseSecretKey.mockReturnValue(true);
    actionMocks.isSupabaseConfigured.mockReturnValue(true);
    actionMocks.resolveRuntimeAuthProvider.mockResolvedValue({
      attempts: 0,
      provider: "local-json",
      reason: "explicit-local-json",
    });
    actionMocks.signOut.mockResolvedValue(null);
    actionMocks.verifyCsrfToken.mockResolvedValue(true);
    actionMocks.verifyLocalJsonAccountPassword.mockResolvedValue(true);
    actionMocks.verifySupabaseAccountPassword.mockResolvedValue(true);
  });

  it("keeps the dialog open with an inline password error for local-json rejection", async () => {
    actionMocks.verifyLocalJsonAccountPassword.mockResolvedValueOnce(false);
    const { deleteAccountAction } = await import("./actions");

    await expect(
      deleteAccountAction({ error: null }, buildDeleteForm({ password: "wrong-password" })),
    ).resolves.toEqual({ error: "password" });

    expect(actionMocks.clearLocalJsonSessionCookie).not.toHaveBeenCalled();
    expect(actionMocks.clearAppSessionCookie).not.toHaveBeenCalled();
    expect(actionMocks.redirect).not.toHaveBeenCalled();
  });

  it("verifies the current Supabase password before deleting the account", async () => {
    actionMocks.getCurrentUser.mockResolvedValueOnce({
      authMode: "supabase",
      avatarDataUrl: null,
      avatarInitials: "AD",
      displayName: "admin",
      email: "admin@test.local",
      id: "manager-1",
      isAuthenticated: true,
      level: 3,
      role: "admin",
      username: "admin",
    });
    actionMocks.resolveRuntimeAuthProvider.mockResolvedValueOnce({
      attempts: 1,
      provider: "supabase",
      reason: "supabase-ready",
    });
    actionMocks.managerFrom.mockReturnValueOnce({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    });
    const { deleteAccountAction } = await import("./actions");

    await expect(
      deleteAccountAction({ error: null }, buildDeleteForm({ password: "admin-password" })),
    ).rejects.toThrow("REDIRECT:/sign-in?success=deleted");

    expect(actionMocks.verifySupabaseAccountPassword).toHaveBeenCalledWith(
      "admin@test.local",
      "admin-password",
    );
    expect(actionMocks.deleteUser).toHaveBeenCalledWith("manager-1");
  });
});
