import { beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => {
  const createSupabaseAccountWithManager = vi.fn();
  const createSupabaseServerClient = vi.fn();
  const isAuthEmailTaken = vi.fn();
  const isInitialSetupRequired = vi.fn();
  const isManagerUsernameTaken = vi.fn();
  const redirect = vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
  const resetRuntimeAuthProviderCache = vi.fn();
  const verifyCsrfToken = vi.fn();
  const writeProjectSetupConfig = vi.fn();

  return {
    createSupabaseAccountWithManager,
    createSupabaseServerClient,
    isAuthEmailTaken,
    isInitialSetupRequired,
    isManagerUsernameTaken,
    redirect,
    resetRuntimeAuthProviderCache,
    verifyCsrfToken,
    writeProjectSetupConfig,
  };
});

vi.mock("next/navigation", () => ({
  redirect: actionMocks.redirect,
}));

vi.mock("@/lib/auth/providers/runtime-auth-provider", () => ({
  resetRuntimeAuthProviderCache: actionMocks.resetRuntimeAuthProviderCache,
}));

vi.mock("@/lib/security/csrf", () => ({
  verifyCsrfToken: actionMocks.verifyCsrfToken,
}));

vi.mock("@/lib/setup/project-setup-config", () => ({
  writeProjectSetupConfig: actionMocks.writeProjectSetupConfig,
}));

vi.mock("@/lib/supabase/account-admin", () => ({
  createSupabaseAccountWithManager: actionMocks.createSupabaseAccountWithManager,
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseSecretKey: () => true,
}));

vi.mock("@/lib/supabase/manager", () => ({
  isAuthEmailTaken: actionMocks.isAuthEmailTaken,
  isInitialSetupRequired: actionMocks.isInitialSetupRequired,
  isManagerUsernameTaken: actionMocks.isManagerUsernameTaken,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: actionMocks.createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/setup-availability", () => ({
  checkSupabaseSetupAvailability: vi.fn(async () => ({
    adminEmail: "admin@example.com",
    adminExists: true,
    available: true,
    managerCount: 1,
    reason: "ready",
    setupState: "remote-initialized",
  })),
}));

import { createInitialAdminAction } from "./actions";

function buildSupabaseInitialAdminForm() {
  const formData = new FormData();

  formData.set("appConfigStorageMode", "connected-db");
  formData.set("authMode", "supabase");
  formData.set("dbMode", "supabase");
  formData.set("email", "new-admin@example.com");
  formData.set("gnbRegions", "top");
  formData.append("gnbRegions", "left");
  formData.set("menuSourceMode", "app-routes");
  formData.set("password", "admin!@#$");
  formData.set("passwordConfirm", "admin!@#$");

  return formData;
}

describe("createInitialAdminAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.createSupabaseAccountWithManager.mockResolvedValue({
      error: null,
      user: { id: "new-user" },
    });
    actionMocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        signUp: vi.fn(),
      },
    });
    actionMocks.isAuthEmailTaken.mockResolvedValue(false);
    actionMocks.isInitialSetupRequired.mockResolvedValue(true);
    actionMocks.isManagerUsernameTaken.mockResolvedValue(true);
    actionMocks.verifyCsrfToken.mockResolvedValue(true);
    actionMocks.writeProjectSetupConfig.mockResolvedValue(null);
  });

  it("links an already initialized Supabase project instead of creating another admin", async () => {
    await expect(
      createInitialAdminAction({} as never, buildSupabaseInitialAdminForm()),
    ).rejects.toThrow("REDIRECT:/sign-in");

    expect(actionMocks.writeProjectSetupConfig).toHaveBeenCalledWith({
      appConfigStorageMode: "connected-db",
      authMode: "supabase",
      dbMode: "supabase",
      gnbLayout: { enabledRegions: ["top", "left"] },
      menuSourceMode: "app-routes",
    });
    expect(actionMocks.resetRuntimeAuthProviderCache).toHaveBeenCalledTimes(1);
    expect(actionMocks.createSupabaseAccountWithManager).not.toHaveBeenCalled();
  });
});
