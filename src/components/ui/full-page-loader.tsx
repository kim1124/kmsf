import { Loader2 } from "lucide-react";

type FullPageLoaderProps = {
  text?: string;
};

export function FullPageLoader({ text = "Loading..." }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <Loader2 className="h-12 w-12 animate-spin text-[#10b981]" />
      <p className="mt-4 text-sm font-semibold tracking-widest text-white">{text}</p>
    </div>
  );
}
