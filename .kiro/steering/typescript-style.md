# TypeScript & React style guide

Applies to everything under `src/`, `shared/`, `server/`, `mcp-server/`, `tests/`.

## Language

- Strict TypeScript. No `any` — use `unknown` and narrow. `as` casts only at
  module boundaries (e.g. `as const` lookups), never to silence an error.
- Every exported function has explicit parameter and return types.
- Prefer `interface` for object shapes, `type` for unions and aliases.

## Purity boundaries

- `shared/` is pure: no DOM, no Node APIs, no `Date.now()` / `Math.random()`
  inside exported functions — pass timestamps in. This keeps every function
  property-testable.
- Side effects live in `server/` (I/O, network, disk) and `src/` (React state,
  localStorage). Never `fetch` from `shared/`.

# Good
```ts
export function dedupeItems(items: NewsItem[]): NewsItem[] { ... }
```

# Bad
```ts
export function dedupeItems(items: any[]) { // no any
  localStorage.setItem("seen", "1"); // no side effects in shared/
}
```

## React

- Function components only. State via hooks; server state fetched in `api.ts`.
- No prop drilling beyond one level — lift state to `App.tsx`.
- Hand-rolled CSS in `src/styles.css` (custom properties for theme). No UI
  frameworks, no CSS-in-JS libraries.
- Every interactive element is a real `<button>`/`<a>` with a title or label.

## Error handling

- A failing feed must never take the board down: `Promise.allSettled` and
  surface per-source errors.
- localStorage access is wrapped in try/catch — private mode can throw.

## Testing

- Example-based tests for concrete regressions; fast-check property tests for
  invariants (idempotence, ordering, subset laws).
- Property tests live in `tests/` and only exercise `shared/` functions.
