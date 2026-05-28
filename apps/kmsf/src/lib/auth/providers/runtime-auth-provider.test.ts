import { describe, expect, it, vi } from "vitest";

import {
  createCachedRuntimeAuthProviderResolver,
  createRuntimeAuthProviderResolver,
} from "./runtime-auth-provider";

describe("runtime auth provider resolution", () => {
  it("checks the Supabase Auth health endpoint for the default Supabase probe", async () => {
    const originalEnv = { ...process.env };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ name: "GoTrue" })));
    vi.stubGlobal("fetch", fetchMock);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "publishable-key";
    delete process.env.SUPABASE_API_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      const resolveRuntimeAuthProvider = createRuntimeAuthProviderResolver({
        readSetupConfig: async () => null,
      });

      await expect(
        resolveRuntimeAuthProvider({
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "publishable-key",
        }),
      ).resolves.toMatchObject({
        provider: "supabase",
        reason: "supabase-ready",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://example.supabase.co/auth/v1/health",
        expect.objectContaining({
          headers: expect.objectContaining({
            apikey: "publishable-key",
          }),
        }),
      );
    } finally {
      process.env = originalEnv;
      vi.unstubAllGlobals();
    }
  });

  it("keeps Supabase when the Supabase probe succeeds", async () => {
    const probeSupabase = vi.fn(async () => undefined);
    const resolveRuntimeAuthProvider = createRuntimeAuthProviderResolver({
      probeSupabase,
      readSetupConfig: async () => null,
    });

    const result = await resolveRuntimeAuthProvider({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(result).toEqual({
      provider: "supabase",
      reason: "supabase-ready",
      attempts: 1,
    });
    expect(probeSupabase).toHaveBeenCalledTimes(1);
  });

  it("falls back to local-json after three failed Supabase probes", async () => {
    const probeSupabase = vi.fn(async () => {
      throw new Error("fetch failed");
    });
    const resolveRuntimeAuthProvider = createRuntimeAuthProviderResolver({
      probeSupabase,
      readSetupConfig: async () => null,
    });

    const result = await resolveRuntimeAuthProvider({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(result).toEqual({
      provider: "local-json",
      reason: "supabase-unavailable",
      attempts: 3,
    });
    expect(probeSupabase).toHaveBeenCalledTimes(3);
  });

  it("uses local-json immediately when explicitly selected", async () => {
    const probeSupabase = vi.fn(async () => undefined);
    const resolveRuntimeAuthProvider = createRuntimeAuthProviderResolver({
      probeSupabase,
      readSetupConfig: async () => null,
    });

    const result = await resolveRuntimeAuthProvider({
      KMSF_AUTH_PROVIDER: "local-json",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(result).toEqual({
      provider: "local-json",
      reason: "explicit-local-json",
      attempts: 0,
    });
    expect(probeSupabase).not.toHaveBeenCalled();
  });

  it("uses the stored local-json setup choice before probing Supabase", async () => {
    const probeSupabase = vi.fn(async () => undefined);
    const resolveRuntimeAuthProvider = createRuntimeAuthProviderResolver({
      probeSupabase,
      readSetupConfig: async () => ({
        authProvider: "local-json",
        updatedAt: "2026-05-26T00:00:00.000Z",
        version: 1,
      }),
    });

    const result = await resolveRuntimeAuthProvider({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(result).toEqual({
      provider: "local-json",
      reason: "stored-local-json",
      attempts: 0,
    });
    expect(probeSupabase).not.toHaveBeenCalled();
  });

  it("reuses the runtime provider result for the same environment", async () => {
    const probeSupabase = vi.fn(async () => {
      throw new Error("fetch failed");
    });
    const resolveRuntimeAuthProvider = createCachedRuntimeAuthProviderResolver({
      probeSupabase,
      readSetupConfig: async () => null,
    });
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    };

    await expect(resolveRuntimeAuthProvider(env)).resolves.toMatchObject({
      provider: "local-json",
      attempts: 3,
    });
    await expect(resolveRuntimeAuthProvider(env)).resolves.toMatchObject({
      provider: "local-json",
      attempts: 3,
    });

    expect(probeSupabase).toHaveBeenCalledTimes(3);
  });
});
