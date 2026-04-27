import { Loader2 } from "lucide-react";

type FullPageLoaderProps = {
  text?: string;
};

export function FullPageLoader({ text = "Loading..." }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div
        aria-label="로딩 중"
        aria-modal="true"
        className="mx-4 flex w-[min(92vw,24rem)] flex-col items-center rounded-2xl border border-border bg-surface px-6 py-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        role="alertdialog"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#10b981] dark:bg-emerald-500/10">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <p className="mt-4 text-sm font-semibold tracking-wide text-foreground">{text}</p>
      </div>
    </div>
  );
}
