import type { AuthProviderKind } from "@/lib/auth/providers/auth-provider";
import type { SystemResetMode } from "@/lib/auth/system-reset";

export type SystemResetAuditStatus = "failed" | "started" | "success";

export type SystemResetAuditEvent = {
  actorEmail: string | null;
  actorId: string;
  actorUsername: string;
  backupRef: string | null;
  createdAt: string;
  errorMessage: string | null;
  id: string;
  mode: SystemResetMode;
  provider: AuthProviderKind;
  status: SystemResetAuditStatus;
};

export type SystemResetActor = {
  email: string | null;
  id: string;
  username: string;
};

export type SystemResetBackupRecord = {
  actor: SystemResetActor;
  createdAt: string;
  id: string;
  mode: SystemResetMode;
  provider: AuthProviderKind;
  snapshot: unknown;
  version: 1;
};

export type SystemResetAuditEventInput = Omit<
  SystemResetAuditEvent,
  "createdAt" | "id"
> &
  Partial<Pick<SystemResetAuditEvent, "createdAt" | "id">>;
