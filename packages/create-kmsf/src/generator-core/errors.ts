export type ScaffoldErrorCode =
  | "InvalidProjectName"
  | "TargetExists"
  | "TemplateMissing"
  | "CopyFailed"
  | "InstallFailed"
  | "GitInitFailed"
  | "PlaywrightInstallFailed"
  | "Aborted"
  | "Internal";

export class ScaffoldError extends Error {
  readonly code: ScaffoldErrorCode;
  constructor(code: ScaffoldErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options as ErrorOptions);
    this.code = code;
    this.name = "ScaffoldError";
  }
}

export class InvalidProjectNameError extends ScaffoldError {
  constructor(name: string, reason: string) {
    super("InvalidProjectName", `invalid project name "${name}": ${reason}`);
  }
}

export class TargetExistsError extends ScaffoldError {
  readonly path: string;
  constructor(path: string) {
    super("TargetExists", `target directory is not empty: ${path}`);
    this.path = path;
  }
}

export class TemplateMissingError extends ScaffoldError {
  constructor(path: string) {
    super("TemplateMissing", `template not found: ${path}. Reinstall create-kmsf.`);
  }
}

export class CopyFailedError extends ScaffoldError {
  constructor(cause: unknown) {
    super("CopyFailed", `failed to copy template: ${formatCause(cause)}`, { cause });
  }
}

function formatCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return String(cause);
}
