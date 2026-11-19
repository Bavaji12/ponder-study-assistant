# Ponder — Study Assistant

An AI-powered React study workspace that turns notes or a topic into validated flashcards and an interactive recall workflow.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/study-assistant run dev` — run the Study Assistant frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: Gemini REST API called only from the backend using the `GEMINI_API_KEY` Replit Secret

## Where things live

- `artifacts/study-assistant/src/App.tsx` — study desk, flashcards, recall check, and missed-card workflow
- `artifacts/study-assistant/src/index.css` — Ponder visual tokens and responsive interaction styling
- `artifacts/api-server/src/routes/study.ts` — secure Gemini proxy, timeout, parsing, and response validation
- `lib/api-spec/openapi.yaml` — source-of-truth contract for study generation

## Architecture decisions

- The model response is never rendered raw; it is parsed and validated on the server before React receives it.
- Flashcard and quiz state lives in React because the assignment values interactive frontend architecture over persistence.
- The server uses a 30-second AbortController timeout so a slow model request becomes a recoverable UI state.

## Product

Learners paste notes or a topic, generate a structured study set, flip through cards, take a recall check, and revisit missed concepts.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
