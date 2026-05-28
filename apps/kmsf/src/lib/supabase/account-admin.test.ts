import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const createUser = vi.fn();
  const deleteUser = vi.fn();
  const listUsers = vi.fn();
  const managerUpsert = vi.fn();
  const managerDeleteIn = vi.fn();
  const managerDelete = vi.fn(() => ({ in: managerDeleteIn }));
  const managerSelect = vi.fn();
  const from = vi.fn(() => ({
    delete: managerDelete,
    select: managerSelect,
    upsert: managerUpsert,
  }));
  const clearProjectSetupConfig = vi.fn();
  const signInWithPassword = vi.fn();
  const signOut = vi.fn();

  return {
    admin: {
      auth: { admin: { createUser, deleteUser, listUsers } },
      from,
    },
    clearProjectSetupConfig,
    createUser,
    deleteUser,
    from,
    listUsers,
    managerDelete,
    managerDeleteIn,
    managerSelect,
    managerUpsert,
    signInWithPassword,
    signOut,
  };
});

vi.mock("@/lib/setup/project-setup-config", () => ({
  clearProjectSetupConfig: mocks.clearProjectSetupConfig,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mocks.admin,
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabaseApiKey: () => "anon-key",
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
    },
  }),
}));

import {
  createSupabaseAccountWithManager,
  listAllSupabaseAuthUsers,
  resetSupabaseFactorySystem,
  verifySupabaseAccountPassword,
} from "./account-admin";

describe("supabase account admin helpers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    mocks.clearProjectSetupConfig.mockReset();
    mocks.createUser.mockReset();
    mocks.deleteUser.mockReset();
    mocks.from.mockClear();
    mocks.listUsers.mockReset();
    mocks.managerDelete.mockClear();
    mocks.managerDeleteIn.mockReset();
    mocks.managerSelect.mockReset();
    mocks.managerUpsert.mockReset();
    mocks.signInWithPassword.mockReset();
    mocks.signOut.mockReset();
  });

  it("lists auth users across pages without generating more than 10 test accounts", async () => {
    mocks.listUsers
      .mockResolvedValueOnce({
        data: { users: Array.from({ length: 5 }, (_, index) => ({ id: `user-${index}` })) },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { users: Array.from({ length: 5 }, (_, index) => ({ id: `user-${index + 5}` })) },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { users: [] },
        error: null,
      });

    await expect(listAllSupabaseAuthUsers({ pageSize: 5 })).resolves.toHaveLength(10);
  });

  it("verifies a Supabase password without persisting a session", async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: "token" }, user: { id: "user-1" } },
      error: null,
    });

    await expect(verifySupabaseAccountPassword("admin@example.com", "Admin01!")).resolves.toBe(true);
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it("creates a Supabase auth user and manager row without storing authorization in user metadata", async () => {
    mocks.createUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mocks.managerUpsert.mockResolvedValueOnce({ error: null });

    await expect(
      createSupabaseAccountWithManager({
        displayName: "관리자",
        email: "admin@example.com",
        emailConfirm: true,
        level: 3,
        password: "Admin01!",
        role: "admin",
        username: "admin01",
      }),
    ).resolves.toMatchObject({ user: { id: "user-1" } });

    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        app_metadata: {
          level: 3,
          role: "admin",
        },
        user_metadata: {
          full_name: "관리자",
          username: "admin01",
        },
      }),
    );
    expect(mocks.managerUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "admin@example.com",
        id: "user-1",
        level: 3,
        role: "admin",
        username: "admin01",
      }),
      { onConflict: "id" },
    );
  });

  it("rolls back the Supabase auth user when manager sync fails", async () => {
    mocks.createUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mocks.managerUpsert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate key" },
    });
    mocks.deleteUser.mockResolvedValueOnce({ error: null });

    await expect(
      createSupabaseAccountWithManager({
        email: "member@example.com",
        password: "Member01!",
        role: "member",
        username: "member01",
      }),
    ).resolves.toMatchObject({
      error: {
        code: "23505",
        message: "duplicate key",
      },
      user: null,
    });

    expect(mocks.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("clears setup config only after all Supabase accounts and manager rows are removed", async () => {
    mocks.listUsers.mockResolvedValueOnce({
      data: { users: [{ id: "user-1" }, { id: "user-2" }] },
      error: null,
    });
    mocks.managerSelect.mockResolvedValueOnce({
      data: [{ id: "user-1" }, { id: "user-3" }],
      error: null,
    });
    mocks.deleteUser.mockResolvedValue({ error: null });
    mocks.managerDeleteIn.mockResolvedValue({ error: null });

    await resetSupabaseFactorySystem();

    expect(mocks.deleteUser).toHaveBeenCalledTimes(2);
    expect(mocks.managerDeleteIn).toHaveBeenCalledWith("id", ["user-1", "user-3"]);
    expect(mocks.clearProjectSetupConfig).toHaveBeenCalled();
  });

  it("does not clear setup config when Supabase user deletion fails", async () => {
    mocks.listUsers.mockResolvedValueOnce({
      data: { users: [{ id: "user-1" }] },
      error: null,
    });
    mocks.managerSelect.mockResolvedValueOnce({
      data: [{ id: "user-1" }],
      error: null,
    });
    mocks.deleteUser.mockResolvedValueOnce({ error: { message: "storage owner" } });

    await expect(resetSupabaseFactorySystem()).rejects.toMatchObject({ code: "delete_failed" });
    expect(mocks.clearProjectSetupConfig).not.toHaveBeenCalled();
  });
});
