# @kmsf/chat Component Rules

## Scope

`src/components` contains React UI for the ChatGPT-like chat surface, setup wizard, settings dialog, embeddable settings page, composer, message list, sidebar, and status controls.

## Rules

- DO NOT: use Next.js-only APIs.
- Build the actual chat work surface as the first screen; do not add a marketing landing page.
- Follow shadcn-compatible composition and `lucide-react` icons.
- MUST: layout dense, scannable, and useful for repeated chat work.
- Provide accessible labels for icon-only controls.
- MUST: settings available both as a dialog and as a host-embeddable page component.
- Support storage selection between local and Supabase in the setup flow.
- MUST: component state thin; core behavior belongs in `src/core`.
- DO NOT: hard-code `apps/kmsf` auth or routing.

## KMSF Style Inheritance

- Component styles inherit the root KMSF design contract in `docs/codex/06-design-style-guide.md` and `docs/codex/07-package-style-contract.md`.
- Define package-scoped CSS variables under the chat root class and make them fall back to `--kmsf-*` tokens.
- MUST: package styles usable outside `apps/kmsf`; the package must not depend on app-only Tailwind classes or app global CSS.
- AVOID: direct hex values in component CSS except package token fallback values.
- The default chat surface uses a ChatGPT-like split layout: conversation list and settings entry on the left, active chat container on the right.
- The settings trigger belongs in the left sidebar footer for the default chat surface.
- Floating chatbot UI is exported as `ChatFloatingButton` and uses the same store, setup, Ollama, and token contracts as the main chat surface.
- Floating chatbot controls use icon buttons with accessible labels; while the session is active, the hover state communicates close/end behavior with an `X` icon.

## Browser Gate

Rendered UI changes require Playwright coverage for setup, chat streaming, settings mode changes, error state, and responsive layout.
