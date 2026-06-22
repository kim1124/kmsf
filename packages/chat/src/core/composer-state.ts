type ComposerKeyInput = {
  isComposing: boolean;
  key: string;
  shiftKey: boolean;
};

export type ComposerKeyAction = "ignore" | "newline" | "submit";

export function getComposerKeyAction(input: ComposerKeyInput): ComposerKeyAction {
  if (input.key !== "Enter") {
    return "ignore";
  }
  if (input.isComposing) {
    return "ignore";
  }
  return input.shiftKey ? "newline" : "submit";
}
