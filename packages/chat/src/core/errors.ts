import type { ChatPackageError } from "./types";

export function createChatError(code: string, message: string, cause?: unknown): ChatPackageError {
  return cause === undefined ? { code, message } : { cause, code, message };
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}
