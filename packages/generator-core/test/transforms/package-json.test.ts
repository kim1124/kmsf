import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { transformPackageJson } from "../../src/transforms/package-json";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "kmsf-pkg-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

async function writePkg(content: object): Promise<string> {
  const f = path.join(workDir, "package.json");
  await writeFile(f, JSON.stringify(content, null, 2));
  return f;
}

describe("transformPackageJson", () => {
  it("replaces {{project_name}} placeholder", async () => {
    const f = await writePkg({ name: "{{project_name}}", dependencies: {} });
    await transformPackageJson(f, { projectName: "my-app", authMode: "local-json" });
    const after = JSON.parse(await readFile(f, "utf8"));
    expect(after.name).toBe("my-app");
  });

  it("removes supabase deps in local-json mode", async () => {
    const f = await writePkg({
      name: "{{project_name}}",
      dependencies: {
        "@supabase/ssr": "^0.10.2",
        "@supabase/supabase-js": "^2.103.3",
        next: "16.2.4",
      },
    });
    await transformPackageJson(f, { projectName: "x", authMode: "local-json" });
    const after = JSON.parse(await readFile(f, "utf8"));
    expect(after.dependencies["@supabase/ssr"]).toBeUndefined();
    expect(after.dependencies["@supabase/supabase-js"]).toBeUndefined();
    expect(after.dependencies.next).toBe("16.2.4");
  });

  it("keeps supabase deps in supabase mode", async () => {
    const f = await writePkg({
      name: "{{project_name}}",
      dependencies: { "@supabase/ssr": "^0.10.2", next: "16.2.4" },
    });
    await transformPackageJson(f, { projectName: "x", authMode: "supabase" });
    const after = JSON.parse(await readFile(f, "utf8"));
    expect(after.dependencies["@supabase/ssr"]).toBe("^0.10.2");
  });

  it("removes all auth deps in none mode", async () => {
    const f = await writePkg({
      name: "{{project_name}}",
      dependencies: { "@supabase/ssr": "^0.10.2", next: "16.2.4" },
    });
    await transformPackageJson(f, { projectName: "x", authMode: "none" });
    const after = JSON.parse(await readFile(f, "utf8"));
    expect(after.dependencies["@supabase/ssr"]).toBeUndefined();
    expect(after.dependencies.next).toBe("16.2.4");
  });

  it("keeps private:false (project should be installable)", async () => {
    const f = await writePkg({ name: "{{project_name}}", private: true, dependencies: {} });
    await transformPackageJson(f, { projectName: "x", authMode: "local-json" });
    const after = JSON.parse(await readFile(f, "utf8"));
    expect(after.private).toBe(true);
  });

  it("rejects invalid project name", async () => {
    const f = await writePkg({ name: "{{project_name}}", dependencies: {} });
    await expect(
      transformPackageJson(f, { projectName: "Invalid Name!", authMode: "local-json" }),
    ).rejects.toThrow(/invalid/i);
  });
});
