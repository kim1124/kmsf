export type ChartThemeValue = "kmsf" | "dark" | "skyblue" | "mint" | "gray" | "orange";

export interface ChartThemeOption {
  label: string;
  palette: string[];
  value: ChartThemeValue;
}

export const chartThemeOptions: ChartThemeOption[] = [
  {
    label: "KMSF",
    palette: ["#064e3b", "#047857", "#059669", "#10b981", "#14b8a6", "#0d9488", "#0f766e", "#2dd4bf", "#34d399", "#5eead4"],
    value: "kmsf",
  },
  {
    label: "Dark",
    palette: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#0f766e", "#0891b2", "#2563eb", "#7c3aed", "#be185d"],
    value: "dark",
  },
  {
    label: "Skyblue",
    palette: ["#075985", "#0369a1", "#0284c7", "#0ea5e9", "#38bdf8", "#67e8f9", "#0891b2", "#0f766e", "#22c55e", "#84cc16"],
    value: "skyblue",
  },
  {
    label: "Mint",
    palette: ["#0f766e", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#6ee7b7", "#34d399", "#22c55e", "#84cc16", "#bef264"],
    value: "mint",
  },
  {
    label: "Gray",
    palette: ["#111827", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#64748b", "#475569", "#334155", "#0f766e"],
    value: "gray",
  },
  {
    label: "Orange",
    palette: ["#7c2d12", "#9a3412", "#c2410c", "#ea580c", "#f97316", "#fb923c", "#f59e0b", "#d97706", "#b45309", "#0f766e"],
    value: "orange",
  },
];

export const defaultChartThemeValue: ChartThemeValue = "kmsf";

export function getChartThemeOption(value: string): ChartThemeOption {
  return chartThemeOptions.find((theme) => theme.value === value) ?? chartThemeOptions[0]!;
}
