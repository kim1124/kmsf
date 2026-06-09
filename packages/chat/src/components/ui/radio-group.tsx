import type { InputHTMLAttributes } from "react";

export function RadioInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="radio" {...props} />;
}
