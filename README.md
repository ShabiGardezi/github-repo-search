# GitHub Repository Search

A small Vue app for searching public GitHub repositories and viewing details in a dialog.

## Stack

- Vue 3 (Composition API, `<script setup>`)
- TypeScript
- Vuetify 3
- Vite
- Vitest

Requires Node 22.18+.

## Run locally

```sh
npm install
npm run dev
```

## Tests

```sh
npm test
```

## Build

```sh
npm run build
```

## Deployed app

github-repo-search-lac.vercel.app

## Architecture

`src/api/github` talks to the GitHub REST API with `fetch`. Search and detail state live in composables (`useRepositorySearch`, `useRepositoryDetail`). `App.vue` wires those to a search form, result cards, and a detail dialog. No router or global store — one screen is enough.

## Decisions

- Native `fetch` instead of Axios. The API surface is two GET endpoints.
- Details open in a dialog, not a new route. Keeps search results on screen.
- Errors are mapped to short user-facing messages. GitHub’s raw `message` is only used to detect rate limits.
- No auth token. Unauthenticated GitHub search is limited (about 60 requests/hour), so rate-limit handling matters in demos.

## Edge cases

- Empty or whitespace-only queries do not hit the API.
- Empty result sets, HTTP errors, network failures, and rate limits (403 remaining 0 / 429) have distinct UI.
- Optional fields (description, language, license, dates, GitHub URL) are omitted when missing.
- Owner/repo names are URL-encoded on the detail request.
- A new search, or opening another repo / closing the dialog, aborts the in-flight request so a stale response cannot overwrite the UI.

## AI assistance

Used Cursor for scaffolding, implementation assistance, testing, and code review. I made the architecture and implementation decisions and reviewed and validated the final code.
