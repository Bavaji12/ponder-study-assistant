Live Link: https://ponder-study-assistant-lpb4ixuid-bavaji12.vercel.app/
# Ponder — Study Assistant

Ponder is a React study assistant for the Flam frontend internship assignment. A learner pastes notes or names a topic, and the app uses a server-side Gemini request to return validated flashcard data. The result becomes a small study workflow rather than a chat transcript:

- flip through generated flashcards
- reveal answers and hints
- complete a multiple-choice recall check
- collect missed cards and revisit them
- start a new study set without reloading the page

## Run locally

This project uses the workspace's pnpm setup:

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/study-assistant run dev
```

The Replit workflows start both services automatically. The frontend calls the API through `/api/study/generate`, so the browser never calls Gemini directly.

## Required secret

Add `GEMINI_API_KEY` as a Replit Secret. It is read only by `artifacts/api-server/src/routes/study.ts`. Do not put the key in frontend code, `VITE_*` variables, source control, or the browser bundle.

## Architecture

The data contract is defined first in `lib/api-spec/openapi.yaml` and generated into the typed API client and Zod schemas.

1. The user submits one free-form prompt.
2. The API validates the prompt length with `GenerateStudySetBody`.
3. The server asks Gemini for JSON only and applies a 30-second timeout.
4. The server strips accidental code fences, parses the response, and validates the complete shape with `GenerateStudySetResponse`.
5. Only validated `StudySet` data is returned to React.
6. The UI renders stateful flashcards and quiz interactions from React state.

Malformed JSON, wrong-shape data, empty responses, missing configuration, failed requests, and slow requests all become visible error states. The client also keeps a request id so a late response cannot replace a newer result.

## Assignment checklist

- React hooks and functional components
- Free-form text input
- Real Gemini API call behind a backend route
- Structured JSON model output
- Defensive parsing and Zod validation
- Loading, empty, error, retry, and timeout states
- Interactive flip cards, quiz scoring, and missed-card review
- Responsive mobile layout
- No chatbot UI

## AI usage note

AI tools were used to help scaffold and implement the app, reason about the assignment requirements, and review the generated code while building. The API contract, server validation, failure handling, study workflow, UI interactions, and README were checked against the assignment criteria and should be understood before the interview walkthrough.

## Known limitations

- Study sets are held in memory in the current browser session; there is no authentication or database persistence because the assignment does not require either.
- Gemini output quality depends on the source notes and model availability.
- The app currently generates flashcards and one recall-check mode rather than multiple study modes.

## Time spent

Approximately 8 hours of implementation and verification, scoped to the assignment's suggested time budget.
