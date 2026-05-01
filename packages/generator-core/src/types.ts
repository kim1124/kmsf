/** Auth provider mode chosen at scaffold time. */
export type AuthMode = "local-json" | "supabase" | "none";

/** Package manager detected from npm_config_user_agent. */
export type PackageManager = "npm" | "pnpm" | "yarn";

/** Logger interface for scaffold steps to report progress. */
export interface ScaffoldLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  step(message: string): void;
  debug(message: string): void;
  /** Mark a step as done; replaces the previous step line. */
  stepDone(durationMs?: number): void;
  /** Mark a step as failed. */
  stepFailed(reason: string): void;
}

/** Options passed by the CLI into scaffold(). */
export interface ScaffoldOptions {
  /** Project name (validated by caller). */
  projectName: string;
  /** Absolute path to target directory (must be empty or non-existent). */
  targetDir: string;
  /** Absolute path to templates root (e.g. .../templates/next-app-base). */
  templateDir: string;
  /** Auth mode. */
  authMode: AuthMode;
  /** Include i18n config and messages/. Default true. */
  includeI18n: boolean;
  /** Run npm install after copy. */
  runInstall: boolean;
  /** Run git init + initial commit. */
  runGitInit: boolean;
  /** Run npx playwright install. */
  runPlaywrightInstall: boolean;
  /** Detected or forced package manager. */
  packageManager: PackageManager;
  /** Logger for progress reporting. */
  logger: ScaffoldLogger;
}

/** Result returned from scaffold(). */
export interface ScaffoldResult {
  /** Project root that was created. */
  projectRoot: string;
  /** Total files copied. */
  filesCopied: number;
  /** Total wall time in milliseconds. */
  durationMs: number;
  /** Soft warnings (post-install partial failures). */
  warnings: string[];
}
