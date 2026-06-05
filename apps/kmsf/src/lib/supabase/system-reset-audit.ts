import type {
  SystemResetActor,
  SystemResetAuditEventInput,
} from "@/lib/auth/system-reset-audit";
import type { AuthProviderKind } from "@/lib/auth/providers/auth-provider";
import type { SystemResetMode } from "@/lib/auth/system-reset";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RpcIdRow = {
  id: string;
};

type SupabaseErrorLike = {
  message?: string;
};

export class SupabaseSystemResetAuditError extends Error {
  constructor(
    public readonly operation: "audit" | "backup",
    message: string,
  ) {
    super(message);
    this.name = "SupabaseSystemResetAuditError";
  }
}

export async function insertSupabaseSystemResetBackup(input: {
  actor: SystemResetActor;
  mode: SystemResetMode;
  provider: AuthProviderKind;
  snapshot: unknown;
}) {
  const id = await callSingleIdRpc("backup", "insert_system_reset_backup", {
    p_actor_email: input.actor.email,
    p_actor_id: input.actor.id,
    p_actor_username: input.actor.username,
    p_mode: input.mode,
    p_provider: input.provider,
    p_snapshot: input.snapshot,
  });

  return {
    id,
    ref: `supabase:system_reset_backups:${id}`,
  };
}

export async function appendSupabaseSystemResetAuditEvent(
  input: SystemResetAuditEventInput,
) {
  const id = await callSingleIdRpc("audit", "insert_system_reset_audit_event", {
    p_actor_email: input.actorEmail,
    p_actor_id: input.actorId,
    p_actor_username: input.actorUsername,
    p_backup_ref: input.backupRef,
    p_error_message: input.errorMessage,
    p_mode: input.mode,
    p_provider: input.provider,
    p_status: input.status,
  });

  return {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    id,
  };
}

async function callSingleIdRpc(
  operation: "audit" | "backup",
  fn: string,
  args: Record<string, unknown>,
) {
  const { data, error } = await createSupabaseAdminClient()
    .rpc(fn, args)
    .single<RpcIdRow>();

  if (error || !data?.id) {
    throw new SupabaseSystemResetAuditError(
      operation,
      error ? formatSupabaseError(error) : "Supabase reset audit RPC returned no id.",
    );
  }

  return data.id;
}

function formatSupabaseError(error: SupabaseErrorLike) {
  return error.message ?? "Supabase reset audit operation failed.";
}
