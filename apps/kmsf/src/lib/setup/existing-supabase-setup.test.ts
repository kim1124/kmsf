import { beforeEach, describe, expect, it, vi } from "vitest";

const setupMocks = vi.hoisted(() => ({
  getCurrentSupabaseSetupAvailability: vi.fn(),
  readProjectSetupConfig: vi.fn(),
  resetRuntimeAuthProviderCache: vi.fn(),
  writeProjectSetupConfig: vi.fn(),
}));

vi.mock("@/lib/auth/providers/runtime-auth-provider", () => ({
  resetRuntimeAuthProviderCache: setupMocks.resetRuntimeAuthProviderCache,
}));

vi.mock("@/lib/setup/project-setup-config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/setup/project-setup-config")>();

  return {
    ...actual,
    readProjectSetupConfig: setupMocks.readProjectSetupConfig,
    writeProjectSetupConfig: setupMocks.writeProjectSetupConfig,
  };
});

vi.mock("@/lib/supabase/setup-availability", () => ({
  getCurrentSupabaseSetupAvailability: setupMocks.getCurrentSupabaseSetupAvailability,
}));

import {
  buildExistingSupabaseSetupConfig,
  linkExistingSupabaseSetupIfDetected,
} from "./existing-supabase-setup";

describe("buildExistingSupabaseSetupConfig", () => {
  const originalDisableExistingSupabaseSetupLink =
    process.env.KMSF_DISABLE_EXISTING_SUPABASE_SETUP_LINK;

  beforeEach(() => {
    vi.clearAllMocks();
    if (originalDisableExistingSupabaseSetupLink === undefined) {
      delete process.env.KMSF_DISABLE_EXISTING_SUPABASE_SETUP_LINK;
    } else {
      process.env.KMSF_DISABLE_EXISTING_SUPABASE_SETUP_LINK =
        originalDisableExistingSupabaseSetupLink;
    }
    setupMocks.readProjectSetupConfig.mockResolvedValue(null);
    setupMocks.writeProjectSetupConfig.mockResolvedValue(null);
  });

  it("builds a local setup profile for an already initialized Supabase project", () => {
    expect(buildExistingSupabaseSetupConfig()).toEqual({
      appConfigStorageMode: "connected-db",
      authMode: "supabase",
      dbMode: "supabase",
      gnbLayout: { enabledRegions: ["top", "left"] },
      menuSourceMode: "manual",
    });
  });

  it("writes local setup config when Supabase is already initialized remotely", async () => {
    setupMocks.getCurrentSupabaseSetupAvailability.mockResolvedValue({
      adminEmail: "admin@example.com",
      adminExists: true,
      available: true,
      managerCount: 1,
      reason: "ready",
      setupState: "remote-initialized",
    });

    await expect(linkExistingSupabaseSetupIfDetected()).resolves.toEqual({
      adminEmail: "admin@example.com",
      linked: true,
    });
    expect(setupMocks.writeProjectSetupConfig).toHaveBeenCalledWith(
      buildExistingSupabaseSetupConfig(),
    );
    expect(setupMocks.resetRuntimeAuthProviderCache).toHaveBeenCalledTimes(1);
  });

  it("does not link Supabase when local setup config already exists", async () => {
    setupMocks.readProjectSetupConfig.mockResolvedValue({
      appConfigStorageMode: "local-storage",
      authMode: "manual",
      authProvider: "local-json",
      dbMode: "none",
      gnbLayout: { enabledRegions: [] },
      menuSourceMode: "manual",
      updatedAt: "2026-06-24T00:00:00.000Z",
      version: 2,
    });

    await expect(linkExistingSupabaseSetupIfDetected()).resolves.toEqual({
      linked: false,
    });
    expect(setupMocks.getCurrentSupabaseSetupAvailability).not.toHaveBeenCalled();
    expect(setupMocks.writeProjectSetupConfig).not.toHaveBeenCalled();
  });

  it("can disable automatic Supabase setup linking for local test isolation", async () => {
    process.env.KMSF_DISABLE_EXISTING_SUPABASE_SETUP_LINK = "1";

    await expect(linkExistingSupabaseSetupIfDetected()).resolves.toEqual({
      linked: false,
    });
    expect(setupMocks.readProjectSetupConfig).not.toHaveBeenCalled();
    expect(setupMocks.getCurrentSupabaseSetupAvailability).not.toHaveBeenCalled();
  });
});
