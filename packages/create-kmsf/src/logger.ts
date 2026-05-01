import pc from "picocolors";
import type { ScaffoldLogger } from "@kmsf/generator-core";

export type LogLevel = "silent" | "info" | "debug";

export interface LoggerOptions {
  out: (s: string) => void;
  err: (s: string) => void;
  level: LogLevel;
  color: boolean;
}

export interface CliLogger extends ScaffoldLogger {}

const LEVEL_RANK: Record<LogLevel, number> = { silent: 0, info: 1, debug: 2 };

export function createLogger(options: LoggerOptions): CliLogger {
  const c = options.color ? pc : null;
  let currentStep: string | null = null;
  let stepStart = 0;

  const enabled = (l: LogLevel): boolean =>
    LEVEL_RANK[options.level] >= LEVEL_RANK[l];

  return {
    info(message) {
      if (!enabled("info")) return;
      options.out(`${message}\n`);
    },
    warn(message) {
      const tag = c ? c.yellow("⚠") : "[warn]";
      options.err(`${tag} ${message}\n`);
    },
    error(message) {
      const tag = c ? c.red("✖") : "[error]";
      options.err(`${tag} ${message}\n`);
    },
    debug(message) {
      if (!enabled("debug")) return;
      const tag = c ? c.dim("debug") : "[debug]";
      options.out(`${tag} ${message}\n`);
    },
    step(message) {
      if (!enabled("info")) return;
      currentStep = message;
      stepStart = Date.now();
      const arrow = c ? c.cyan("›") : "›";
      options.out(`${arrow} ${message} ...\n`);
    },
    stepDone(durationMs) {
      if (!enabled("info") || !currentStep) return;
      const ms = durationMs ?? Date.now() - stepStart;
      const tag = c ? c.green("✔") : "✔";
      options.out(`${tag} ${currentStep} (${ms}ms)\n`);
      currentStep = null;
    },
    stepFailed(reason) {
      if (!currentStep) return;
      const tag = c ? c.yellow("⚠") : "[warn]";
      options.err(`${tag} ${currentStep} failed: ${reason}\n`);
      currentStep = null;
    },
  };
}
