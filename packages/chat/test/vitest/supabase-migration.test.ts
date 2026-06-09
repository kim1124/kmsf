import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const packageRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

describe("Supabase migration contract", () => {
  it("defines user-scoped chat tables with RLS and indexes", () => {
    const sql = readFileSync(
      resolve(packageRoot, "supabase/migrations/202606080001_kmsf_chat_history.sql"),
      "utf8",
    ).toLowerCase();

    for (const table of ["kmsf_chat_threads", "kmsf_chat_messages", "kmsf_chat_settings"]) {
      expect(sql).toContain(`create table if not exists public.${table}`);
      expect(sql).toContain(`alter table public.${table} enable row level security`);
      expect(sql).toContain(`to authenticated`);
      expect(sql).toContain(`grant select, insert, update, delete on public.${table} to authenticated`);
    }

    expect(sql).toContain("(select auth.uid()) = user_id");
    expect(sql).toContain("kmsf_chat_threads_user_updated_idx");
    expect(sql).toContain("kmsf_chat_messages_thread_created_idx");
    expect(sql).toContain("kmsf_chat_settings_user_idx");
    expect(sql).not.toContain("security definer");
  });
});
