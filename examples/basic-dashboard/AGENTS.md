# KMSF Example Workspace Rules

## Scope

These rules apply to the package-consumer example workspace at `examples/basic-dashboard`.

## Workspace Role

- This workspace is not the main product application.
- Use it to verify that reusable `@kmsf/*` packages can be imported and rendered by a minimal consumer app.
- Keep the example small and focused on package-consumption behavior.

## Working Rules

- Do not re-implement main product features here.
- If a behavior belongs to shared packages, update the package first and only keep minimal verification UI in this example.
- Prefer `lint` and `build` as the default verification path for this workspace.

## Verification

- `npm --workspace=examples/basic-dashboard run lint`
- `npm --workspace=examples/basic-dashboard run build`
- add browser verification only when the example UI itself changes materially
