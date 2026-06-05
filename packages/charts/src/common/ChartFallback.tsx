import type { CSSProperties } from "react";

export function ChartFallback(props: {
  className?: string;
  height?: number | string;
  message: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={props.className}
      role="status"
      style={{
        alignItems: "center",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        display: "flex",
        height: props.height ?? 320,
        justifyContent: "center",
        minHeight: 160,
        padding: 16,
        textAlign: "center",
        width: "100%",
        ...props.style,
      }}
    >
      {props.message}
    </div>
  );
}
