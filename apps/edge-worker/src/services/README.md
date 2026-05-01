# Services Conventions

## Purpose

This directory is the service layer for `apps/edge-worker`.

Its job is to keep route files thin and keep domain logic close to the data and contracts it serves.

For a new Worker route/service pair, start from:

- `tools/templates/worker/route.template.ts`
- `tools/templates/worker/service.template.ts`

The route template owns HTTP concerns; the service template owns domain data assembly.

Current domains:

- `behavior/`
- `chat/`
- `content/`
- `dashboard/`
- `preferences/`
- `reports/`
- `system/`

Top-level exports live in [index.ts](/E:/python/杂谈-想法记录与实践/apps/edge-worker/src/services/index.ts).

## Layer Rules

### `route`

Location:
- `apps/edge-worker/src/routes/*.ts`

Responsibilities:
- Parse request params and body
- Resolve auth/user identity
- Call services
- Translate service results into HTTP responses
- Handle route-local status codes such as `400`, `401`, `404`, `500`

Must not:
- Contain large SQL blocks when a `store` already exists
- Reimplement business rules that belong in `builder` or `actions`
- Become the only place that knows how a domain works

Target shape:
- Thin orchestration only

### `builder`

Location:
- `apps/edge-worker/src/services/**/builder.ts`

Responsibilities:
- Build derived view models
- Aggregate raw records into page payloads
- Compute deterministic presentation-oriented data such as:
  - period boundaries
  - quality summaries
  - ranking/grouping payloads
  - trend objects

Must not:
- Perform writes
- Own HTTP concerns
- Hide database side effects

Use `builder` when:
- Output is a computed object
- Input is already loaded from one or more stores
- Logic is mostly pure or close to pure

### `store`

Location:
- `apps/edge-worker/src/services/**/store.ts`

Responsibilities:
- Read and write database rows
- Centralize SQL for one domain
- Return raw rows or stable service-level record types
- Own cache-hit lookup helpers and persistence helpers

Must not:
- Return route-specific HTTP envelopes
- Mix many unrelated domains into one file
- Duplicate logic that already exists in another domain store

Use `store` when:
- Logic is primarily SQL or persistence orchestration
- The same query/write path is used by multiple routes

### `actions`

Location:
- `apps/edge-worker/src/services/**/actions.ts`
- `apps/edge-worker/src/services/**/<entity>Actions.ts`

Responsibilities:
- Execute domain commands
- Coordinate one user intent into one or more writes
- Produce stable action results for routes and chat flows

Must not:
- Parse HTTP requests
- Own long-term query composition that belongs in `store`
- Become a generic dumping ground for every helper

Use `actions` when:
- The operation is command-like
- It changes facts
- It may touch multiple tables in one business step

### `types`

Location:
- `apps/edge-worker/src/services/**/types.ts`

Responsibilities:
- Define service-level shared types
- Keep domain result types stable across route, store, builder, and actions

Must not:
- Mirror every database column unless needed
- Become a second copy of `packages/contracts`

Use `types` when:
- Multiple service files in one domain need the same result shape

## Import Rules

Preferred import path:

- Route imports from domain barrel:
  - `../services/chat`
  - `../services/reports`
  - `../services/dashboard`
  - `../services/preferences`
  - `../services/content`
  - `../services/behavior`
  - `../services/system`

- Domain barrels are public APIs.
  - Use explicit exports.
  - Do not use `export *` once a domain has internal sublayers.
  - Export route-facing entrypoints and stable result types only.

- Domain internals may import sibling files directly:
  - `./store`
  - `./types`
  - `./todoActions`

Do not:
- Reach across domains for deep file imports unless there is no stable shared entry yet
- Import route files into services
- Import internal domain files from routes when a public API exists

## Domain Boundaries

### `behavior`

Owns:
- todos overview helpers
- favorites/history/note behavior queries used as shared behavior facts
- user settings and AI provider preference writes
- activity counters and recent behavior facts used by growth/profile/report flows

Current sublayers:
- `store.ts`
- `builder.ts`
- `actions.ts`
- `types.ts`

Rule:
- Routes and cross-domain flows should import behavior facts and actions from the `behavior` barrel.
- New user-facing writes belong in `actions.ts`; raw table reads and writes belong in `store.ts`; response mapping belongs in `builder.ts`.
- Keep `index.ts` explicit so new exports are intentional public API decisions.

Should not own:
- content ranking
- report assembly
- chat intent parsing

### `content`

Owns:
- hot topic/article/opportunity read paths
- interest matching helpers
- ranking helpers for content candidates
- daily digest result reads and digest consultation

Current sublayers:
- `store.ts`
- `builder.ts`
- `actions.ts`
- `consult.ts`
- `types.ts`

Rule:
- Routes and cross-domain flows should import content reads, ranking helpers, and consultation entrypoints from the `content` barrel.
- Detail response shaping belongs in `builder.ts`; source reads and ranking facts belong in `store.ts`; LLM consultation stays in `consult.ts`.
- Keep `index.ts` explicit so content selection helpers do not become accidental page orchestration APIs.

Should not own:
- page-specific Today payload assembly if it grows beyond content selection
- user behavior writes

### `chat`

Owns:
- intent parsing
- session/message persistence
- command execution for chat-driven actions
- message stream, confirmation, and reclassify flow orchestration

Current sublayers:
- `flow.ts`
- `intent.ts`
- `store.ts`
- `actions.ts`
- `interestActions.ts`
- `todoActions.ts`
- `noteActions.ts`
- `settingsActions.ts`
- `types.ts`

Rule:
- Routes should call `createChatMessageStream()`, `confirmChatMessage()`, and `reclassifyChatMessage()` from the `chat` barrel.
- Chat request bodies and SSE event payloads are shared contracts in `packages/contracts/src/page-data.ts`; change the contract first, then update Worker flow and web parsing.
- SSE event sequencing, provider resolution, LLM calls, and assistant-message persistence belong in `flow.ts`, not in routes.
- New chat commands should usually land in a dedicated `*Actions.ts` file, then be wired through `actions.ts`

### `dashboard`

Owns:
- Today page data loading
- Today content selection
- Today briefing payload normalization
- Today briefing persistence and generation orchestration

Current sublayers:
- `today-page.ts`
- `today-content.ts`
- `today-briefing-payload.ts`
- `today-briefing-store.ts`
- `today-briefing-generation.ts`

Rule:
- Routes should call `loadTodayPageData()` from the `dashboard` barrel.
- Schedulers should call `runTodayBriefingCron()` from the `dashboard` barrel.
- Content selection, payload fallback, database access, and generation details stay behind the public API.

### `reports`

Owns:
- report source reads
- report result persistence
- report payload builders
- report cache lookup, LLM block generation, evidence merging, and report persistence flow

Current sublayers:
- `flow.ts`
- `builder.ts`
- `llm-blocks.ts`
- `store.ts`

Rule:
- Routes should call `listReportSummaries()`, `loadPeriodicReport()`, and `loadAnnualReport()` from the `reports` barrel.
- Report routes should not resolve AI providers, check LLM quota, merge LLM blocks, or upsert report payloads directly.
- Source row readers remain exported for cross-domain overview pages until those pages get their own service flow.

### `preferences`

Owns:
- profile response assembly
- AI profile generation flow
- growth overview assembly

Current sublayers:
- `flow.ts`

Rule:
- Routes should call `loadUserProfile()`, `generateUserProfileForUser()`, and `loadGrowthOverview()` from the `preferences` barrel.
- Preference routes should not resolve AI providers, check LLM quota, load report source rows, or assemble growth overview payloads directly.
- Simple settings and AI provider preference writes can remain in routes until they need their own service flow.

### `system`

Owns:
- system support-chain facts and health counters
- summary task state reads/writes
- ingestion/AI processing run writes
- operation log and replay task writes/reads
- feedback submission reads/writes

Current sublayers:
- `store.ts`
- `builder.ts`
- `actions.ts`
- `types.ts`

Rule:
- Routes should import diagnostics, summary-task actions, replay, and feedback entrypoints from the `system` barrel.
- Executor-facing state transitions belong in `actions.ts`; persistence belongs in `store.ts`; response mapping belongs in `builder.ts`.
- Keep `index.ts` explicit so internal persistence helpers are not promoted by wildcard exports.

Should not own:
- user-facing content ranking
- profile/growth aggregation
- chat intent flows

### `briefing`

Owns:
- provider-facing briefing request helpers used by dashboard generation flows

Current sublayers:
- `llm-briefing.ts`

Rule:
- Keep briefing provider mechanics behind the dashboard generation flow unless another
  route-facing domain gets a stable public need for them.

Should not own:
- Today page payload assembly
- route-facing scheduler orchestration
- user behavior facts

## When Adding New Code

Follow this order:

1. Decide domain first
2. Decide whether it is `store`, `builder`, `actions`, or `types`
3. Add or extend the domain barrel `index.ts`
4. Update routes to consume the barrel instead of deep paths where practical

Before adding exports to a domain barrel, ask:

- Is this a route-facing capability or scheduler-facing capability?
- Is this a stable domain result type?
- Would exposing this helper make routes know too much about internals?

If the answer is "internal helper", keep it in the sublayer file and do not export it from the barrel.

## Refactor Guidance

If a route file grows because of:

- repeated SQL:
  move to `store`

- repeated object construction:
  move to `builder`

- multi-table write workflows:
  move to `actions`

- repeated response/result shapes across service files:
  move to `types`

## Non-Goals

This directory does not try to:

- replace `packages/contracts`
- define frontend DTOs
- recreate backend framework abstractions
- force every domain to have every file type

Only create the files a domain actually needs.
