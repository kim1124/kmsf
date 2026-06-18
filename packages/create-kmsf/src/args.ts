import { parseArgs } from "node:util";
import type { AuthMode, GnbRegion, KmsfPackageId } from "./generator-core/index.js";
import { parseGnbRegionList } from "./generator-core/gnb-layout-options.js";
import { parseKmsfPackageList } from "./generator-core/package-options.js";

export interface ParsedArgs {
  projectName?: string;
  authMode?: AuthMode;
  selectedPackages?: KmsfPackageId[];
  gnbRegions?: GnbRegion[];
  includeI18n?: boolean;
  runInstall?: boolean;
  runGitInit?: boolean;
  runPlaywrightInstall?: boolean;
  silent?: boolean;
  verbose?: boolean;
  help?: boolean;
  version?: boolean;
}

const VALID_AUTH: ReadonlyArray<AuthMode> = ["local-json", "supabase", "later", "none"];

export function parseCliArgs(argv: string[]): ParsedArgs {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      auth: { type: "string" },
      layout: { type: "string" },
      packages: { type: "string" },
      "no-packages": { type: "boolean" },
      i18n: { type: "boolean" },
      "no-i18n": { type: "boolean" },
      install: { type: "boolean" },
      "no-install": { type: "boolean" },
      git: { type: "boolean" },
      "no-git": { type: "boolean" },
      playwright: { type: "boolean" },
      "no-playwright": { type: "boolean" },
      silent: { type: "boolean" },
      verbose: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  const result: ParsedArgs = {};

  if (positionals.length > 0) result.projectName = positionals[0];

  if (typeof values.auth === "string") {
    if (!VALID_AUTH.includes(values.auth as AuthMode)) {
      throw new Error(`invalid --auth value: ${values.auth}. Use ${VALID_AUTH.join(" | ")}`);
    }
    result.authMode = values.auth as AuthMode;
  }

  if (typeof values.layout === "string") {
    result.gnbRegions = parseGnbRegionList(values.layout);
  }

  if (values["no-packages"]) {
    result.selectedPackages = [];
  } else if (typeof values.packages === "string") {
    result.selectedPackages = parseKmsfPackageList(values.packages);
  }

  // boolean toggles: presence of --no-x wins
  if (values["no-i18n"]) result.includeI18n = false;
  else if (values.i18n) result.includeI18n = true;
  if (values["no-install"]) result.runInstall = false;
  else if (values.install) result.runInstall = true;
  if (values["no-git"]) result.runGitInit = false;
  else if (values.git) result.runGitInit = true;
  if (values["no-playwright"]) result.runPlaywrightInstall = false;
  else if (values.playwright) result.runPlaywrightInstall = true;

  if (values.silent) result.silent = true;
  if (values.verbose) result.verbose = true;
  if (values.help) result.help = true;
  if (values.version) result.version = true;

  return result;
}

export const HELP_TEXT = `
Usage: npx create-kmsf [name] [options]

Options:
  --auth=<mode>           local-json (default) | supabase | later | none
  --layout=<list>         comma-separated GNB regions: top,left,right,footer
  --packages=<list>       comma-separated KMSF packages: gridstack,data-table,charts,chat
  --no-packages           include no optional KMSF packages
  --no-i18n               skip ko/en i18n setup
  --no-install            skip npm install
  --no-git                skip git init
  --no-playwright         skip playwright browser install
  --silent                no banner / colors / prompts; requires all options (CI)
  --verbose               extra debug logs
  -h, --help              this message
  -v, --version           print version
`.trim();
