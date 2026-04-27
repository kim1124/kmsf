export function formatNumberWithComma(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value ?? "");
  }

  return new Intl.NumberFormat("en-US").format(value);
}

export function ellipsisLabel(value: unknown, maxLength = 12): string {
  const text = String(value ?? "");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}
