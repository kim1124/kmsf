import { describe, expect, it, vi } from "vitest";

import { checkSupabaseSetupAvailability } from "./setup-availability";

describe("checkSupabaseSetupAvailability", () => {
  it("checks Supabase with server-side keys even when the runtime auth provider is forced to local-json", async () => {
    const verifyAdminAccess = vi.fn(async () => undefined);
    const probeAuthHealth = vi.fn(async () => undefined);
    const inspectSetupState = vi.fn(async () => ({
      adminEmail: null,
      adminExists: false,
      managerCount: 0,
      setupState: "fresh" as const,
    }));

    await expect(
      checkSupabaseSetupAvailability(
        {
          KMSF_AUTH_PROVIDER: "local-json",
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          SUPABASE_API_KEY: "anon-key",
          SUPABASE_SECRET_KEY: "secret-key",
        },
        {
          inspectSetupState,
          probeAuthHealth,
          verifyAdminAccess,
        },
      ),
    ).resolves.toEqual({
      adminEmail: null,
      adminExists: false,
      available: true,
      managerCount: 0,
      reason: "ready",
      setupState: "fresh",
    });
    expect(probeAuthHealth).toHaveBeenCalledTimes(1);
    expect(verifyAdminAccess).toHaveBeenCalledTimes(1);
    expect(inspectSetupState).toHaveBeenCalledTimes(1);
  });

  it("keeps Supabase unavailable until the secret key is present", async () => {
    const verifyAdminAccess = vi.fn(async () => undefined);
    const probeAuthHealth = vi.fn(async () => undefined);

    await expect(
      checkSupabaseSetupAvailability(
        {
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          SUPABASE_API_KEY: "anon-key",
        },
        {
          probeAuthHealth,
          verifyAdminAccess,
        },
      ),
    ).resolves.toEqual({
      adminEmail: null,
      adminExists: false,
      available: false,
      managerCount: null,
      reason: "missing-secret-key",
      setupState: "unknown",
    });
    expect(probeAuthHealth).not.toHaveBeenCalled();
    expect(verifyAdminAccess).not.toHaveBeenCalled();
  });

  it("detects an already initialized Supabase manager store", async () => {
    await expect(
      checkSupabaseSetupAvailability(
        {
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          SUPABASE_API_KEY: "anon-key",
          SUPABASE_SECRET_KEY: "secret-key",
        },
        {
          inspectSetupState: vi.fn(async () => ({
            adminEmail: "admin@example.com",
            adminExists: true,
            managerCount: 1,
            setupState: "remote-initialized" as const,
          })),
          probeAuthHealth: vi.fn(async () => undefined),
          verifyAdminAccess: vi.fn(async () => undefined),
        },
      ),
    ).resolves.toMatchObject({
      adminEmail: "admin@example.com",
      adminExists: true,
      available: true,
      managerCount: 1,
      reason: "ready",
      setupState: "remote-initialized",
    });
  });
});
