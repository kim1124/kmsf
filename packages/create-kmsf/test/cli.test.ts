import { describe, it, expect } from "vitest";
import { parseCliArgs, HELP_TEXT } from "../src/args.js";
import { renderBanner } from "../src/banner.js";

describe("HELP_TEXT", () => {
  it("matches snapshot", () => {
    expect(HELP_TEXT).toMatchInlineSnapshot(`
	      "Usage: npx create-kmsf [name] [options]

	      Options:
	        --auth=<mode>           local-json (default) | supabase | none
	        --no-i18n               skip ko/en i18n setup
	        --no-install            skip npm install
	        --no-git                skip git init
	        --no-playwright         skip playwright browser install
	        --silent                no banner / colors / prompts; requires all options (CI)
	        --verbose               extra debug logs
	        -h, --help              this message
	        -v, --version           print version"
    `);
  });
});

describe("renderBanner snapshot", () => {
  it("colorless banner", () => {
    expect(renderBanner({ version: "0.1.0", color: false })).toMatchInlineSnapshot(`
      "
        ▰▰▰  KMSF
        Next.js admin dashboard scaffolder · v0.1.0
        -----------------------------------------
      "
    `);
  });
});

describe("parseCliArgs snapshots", () => {
  it("local-json + no install + no git", () => {
    expect(
      parseCliArgs(["my-app", "--auth=local-json", "--no-install", "--no-git"]),
    ).toMatchInlineSnapshot(`
      {
        "authMode": "local-json",
        "projectName": "my-app",
        "runGitInit": false,
        "runInstall": false,
      }
    `);
  });

  it("none mode silent", () => {
    expect(parseCliArgs(["app", "--auth=none", "--silent"])).toMatchInlineSnapshot(`
      {
        "authMode": "none",
        "projectName": "app",
        "silent": true,
      }
    `);
  });
});
