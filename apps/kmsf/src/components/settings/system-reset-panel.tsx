"use client";

import { useMemo, useState } from "react";

import { resetSystemAction } from "@/app/[locale]/(protected)/actions";
import {
  getSystemResetConfirmation,
  type SystemResetMode,
} from "@/lib/auth/system-reset";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SystemResetPanelProps = {
  csrfToken: string;
  errorMessage: string | null;
  labels: {
    button: string;
    confirm: string;
    confirmation: string;
    confirmationPlaceholder: string;
    description: string;
    dialogDescription: string;
    dialogTitle: string;
    factoryDescription: string;
    factoryMode: string;
    mode: string;
    password: string;
    riskAccepted: string;
    settingsDescription: string;
    settingsMode: string;
    title: string;
  };
};

export function SystemResetPanel({ csrfToken, errorMessage, labels }: SystemResetPanelProps) {
  const [mode, setMode] = useState<SystemResetMode>("factory");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [riskAccepted, setRiskAccepted] = useState(false);
  const expectedConfirmation = getSystemResetConfirmation(mode);
  const canSubmit = useMemo(
    () =>
      password.length > 0 &&
      riskAccepted &&
      confirmation.trim() === expectedConfirmation,
    [confirmation, expectedConfirmation, password, riskAccepted],
  );

  return (
    <article className="content-panel p-6">
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">{labels.title}</h3>
      <p className="mt-2 text-sm leading-6 text-foreground/65">{labels.description}</p>
      <p className="mt-4 rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4 text-sm text-foreground/70">
        {mode === "factory" ? labels.factoryDescription : labels.settingsDescription}
      </p>
      {errorMessage ? (
        <p className="mt-4 rounded-[var(--kmsf-radius-xl)] border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {errorMessage}
        </p>
      ) : null}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-6" type="button" variant="destructive">
            {labels.button}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.dialogTitle}</DialogTitle>
            <DialogDescription>{labels.dialogDescription}</DialogDescription>
          </DialogHeader>
          <form action={resetSystemAction} className="mt-5 space-y-4">
            <input name="csrfToken" type="hidden" value={csrfToken} />
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">{labels.mode}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["factory", labels.factoryMode],
                    ["settings", labels.settingsMode],
                  ] satisfies Array<[SystemResetMode, string]>
                ).map(([optionMode, label]) => (
                    <label
                      className="flex min-h-12 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10"
                      htmlFor={`system-reset-mode-${optionMode}`}
                      key={optionMode}
                    >
                      <input
                        checked={mode === optionMode}
                        className="size-4 accent-[var(--kmsf-color-accent)]"
                        id={`system-reset-mode-${optionMode}`}
                        name="mode"
                        onChange={() => {
                          setMode(optionMode);
                          setConfirmation("");
                          setRiskAccepted(false);
                        }}
                        type="radio"
                        value={optionMode}
                      />
                      {label}
                    </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="system-reset-password">
                {labels.password}
              </label>
              <Input
                autoComplete="current-password"
                id="system-reset-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="system-reset-confirmation">
                {labels.confirmation}
              </label>
              <Input
                id="system-reset-confirmation"
                name="confirmation"
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={`${labels.confirmationPlaceholder}: ${expectedConfirmation}`}
                value={confirmation}
              />
            </div>
            <label
              className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
              htmlFor="system-reset-risk-accepted"
            >
              <input
                checked={riskAccepted}
                className="mt-1 size-4 accent-red-600"
                id="system-reset-risk-accepted"
                name="riskAccepted"
                onChange={(event) => setRiskAccepted(event.target.checked)}
                type="checkbox"
              />
              {labels.riskAccepted}
            </label>
            <div className="flex justify-end">
              <Button disabled={!canSubmit} type="submit" variant="destructive">
                {labels.confirm}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
}
