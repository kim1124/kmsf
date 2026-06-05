import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const upsert = vi.fn();
  const updateEq = vi.fn();
  const update = vi.fn(() => ({ eq: updateEq }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select, update, upsert }));
  const rpc = vi.fn();
  const hasServiceRole = vi.fn(() => false);

  return {
    admin: { from },
    client: { from, rpc },
    eq,
    from,
    hasServiceRole,
    maybeSingle,
    rpc,
    select,
    update,
    updateEq,
    upsert,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => supabaseMocks.admin),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseSecretKey: () => supabaseMocks.hasServiceRole(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => supabaseMocks.client),
}));

import {
  buildManagerRecord,
  ensureManagerProfile,
  findManagerLoginEmail,
  findManagerLoginIdentity,
  isManagerUsernameTaken,
  touchManagerLastSignedIn,
} from "./manager";

describe("manager Supabase helpers", () => {
  beforeEach(() => {
    supabaseMocks.from.mockClear();
    supabaseMocks.select.mockClear();
    supabaseMocks.eq.mockClear();
    supabaseMocks.maybeSingle.mockReset();
    supabaseMocks.rpc.mockReset();
    supabaseMocks.hasServiceRole.mockReturnValue(false);
    supabaseMocks.update.mockClear();
    supabaseMocks.updateEq.mockReset();
    supabaseMocks.upsert.mockReset();
  });

  it("builds manager records with last sign-in metadata", () => {
    expect(
      buildManagerRecord({
        email: "admin@example.com",
        id: "manager-1",
        username: "admin01",
      }),
    ).toMatchObject({
      email: "admin@example.com",
      id: "manager-1",
      last_signed_in_at: null,
      username: "admin01",
    });
  });

  it("updates manager last sign-in timestamp using the admin client", async () => {
    supabaseMocks.hasServiceRole.mockReturnValue(true);
    supabaseMocks.updateEq.mockResolvedValue({ error: null });

    await touchManagerLastSignedIn("manager-1");

    expect(supabaseMocks.from).toHaveBeenCalledWith("manager");
    expect(supabaseMocks.update).toHaveBeenCalledWith({
      last_signed_in_at: expect.any(String),
      updated_at: expect.any(String),
    });
    expect(supabaseMocks.updateEq).toHaveBeenCalledWith("id", "manager-1");
  });

  it("does not rewrite created_at during profile sync", async () => {
    supabaseMocks.hasServiceRole.mockReturnValue(true);
    supabaseMocks.upsert.mockResolvedValue({ error: null });

    await ensureManagerProfile({
      email: "admin@example.com",
      id: "manager-1",
      username: "admin01",
    });

    expect(supabaseMocks.upsert).toHaveBeenCalledWith(
      expect.not.objectContaining({
        created_at: expect.any(String),
      }),
      { onConflict: "id" },
    );
  });

  it("returns a stable manager identity for account-scoped login guards", async () => {
    supabaseMocks.hasServiceRole.mockReturnValue(true);
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: {
        email: "member01@example.com",
        id: "00000000-0000-0000-0000-000000000001",
        username: "member01",
      },
      error: null,
    });

    await expect(findManagerLoginIdentity("member01")).resolves.toEqual({
      email: "member01@example.com",
      id: "00000000-0000-0000-0000-000000000001",
      username: "member01",
    });
    expect(supabaseMocks.select).toHaveBeenCalledWith("id, email, username");
    expect(supabaseMocks.eq).toHaveBeenCalledWith("username", "member01");
  });

  it("falls back to manager table lookup when username RPC is missing", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function public.get_manager_login_email(login_username)",
      },
    });
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: { email: "member01@example.com" },
      error: null,
    });

    await expect(findManagerLoginEmail("member01")).resolves.toBe("member01@example.com");
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("get_manager_login_email", {
      login_username: "member01",
    });
    expect(supabaseMocks.from).toHaveBeenCalledWith("manager");
    expect(supabaseMocks.select).toHaveBeenCalledWith("email");
    expect(supabaseMocks.eq).toHaveBeenCalledWith("username", "member01");
  });

  it("checks manager table when username RPC is missing during duplicate checks", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function public.get_manager_login_email(login_username)",
      },
    });
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: { id: "manager-1" },
      error: null,
    });

    await expect(isManagerUsernameTaken("member01")).resolves.toBe(true);
    expect(supabaseMocks.from).toHaveBeenCalledWith("manager");
    expect(supabaseMocks.select).toHaveBeenCalledWith("id");
    expect(supabaseMocks.eq).toHaveBeenCalledWith("username", "member01");
  });
});
