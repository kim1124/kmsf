import { redirect } from "next/navigation";

import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { getCurrentUser } from "@/lib/auth/session";
import { linkExistingSupabaseSetupIfDetected } from "@/lib/setup/existing-supabase-setup";
import { readProjectSetupConfig } from "@/lib/setup/project-setup-config";
import { resolveRootRoute } from "@/lib/setup/root-routing";
import { isInitialSetupRequired } from "@/lib/supabase/manager";

export default async function RootPage() {
  const existingSupabaseSetup = await linkExistingSupabaseSetupIfDetected();

  if (existingSupabaseSetup.linked) {
    redirect("/sign-in");
  }

  const setupRequired = await isInitialSetupRequired();
  const user = await getCurrentUser();
  const setupConfig = await readProjectSetupConfig();
  const route = resolveRootRoute({
    isAppSessionActive: user ? await isRequestAppSessionActive() : false,
    setupConfig,
    setupRequired,
    user,
  });

  if (route.kind === "redirect") {
    redirect(route.href);
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-[var(--kmsf-radius-lg)] border border-border bg-surface font-display text-lg font-semibold text-accent">
          K
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">KMSF</h1>
        <p className="mt-4 text-base leading-7 text-foreground/65">
          KMSF는 개발자가 프로젝트 구조, 레이아웃, 인증, 저장 방식을 직접 선택해
          시작할 수 있는 Next.js 보일러 플레이트입니다.
        </p>
      </section>
    </main>
  );
}
