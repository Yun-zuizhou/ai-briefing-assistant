# Services Conventions

## Purpose

This directory is the service layer for `apps/edge-worker`.

Its job is to keep route files thin and keep domain logic close to the data and contracts it serves.

Current domains:

- `behavior/`
- `chat/`
- `content/`
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
  - `../services/content`
  - `../services/behavior`
  - `../services/system`

- Domain internals may import sibling files directly:
  - `./store`
  - `./types`
  - `./todoActions`

Do not:
- Reach across domains for deep file imports unless there is no stable shared entry yet
- Import route files into services

## Domain Boundaries

### `behavior`

Owns:
- todos overview helpers
- favorites/history/note behavior queries used as shared behavior facts

Should not own:
- content ranking
- report assembly
- chat intent parsing

### `content`

Owns:
- hot topic/article/opportunity read paths
- interest matching helpers
- ranking helpers for content candidates

Should not own:
- page-specific Today payload assembly if it grows beyond content selection
- user behavior writes

### `chat`

Owns:
- intent parsing
- session/message persistence
- command execution for chat-driven actions

Current sublayers:
- `intent.ts`
- `store.ts`
- `actions.ts`
- `interestActions.ts`
- `todoActions.ts`
- `noteActions.ts`
- `settingsActions.ts`
- `types.ts`

Rule:
- New chat commands should usually land in a dedicated `*Actions.ts` file, then be wired through `actions.ts`

### `reports`

Owns:
- report source reads
- report result persistence
- report payload builders

Current sublayers:
- `builder.ts`
- `store.ts`

Rule:
- Route should fetch source rows from `store`, build payloads with `builder`, then persist through `store`

### `system`

Owns:
- system support-chain facts and health counters
- summary task state reads/writes
- ingestion/AI processing run writes
- operation log and replay task writes/reads
- feedback submission reads/writes

Should not own:
- user-facing content ranking
- profile/growth aggregation
- chat intent flows

## When Adding New Code

Follow this order:

1. Decide domain first
2. Decide whether it is `store`, `builder`, `actions`, or `types`
3. Add or extend the domain barrel `index.ts`
4. Update routes to consume the barrel instead of deep paths where practical

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
