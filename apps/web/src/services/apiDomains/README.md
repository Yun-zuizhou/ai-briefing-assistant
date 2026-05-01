# Frontend API Domains

`apps/web/src/services/api.ts` is the stable facade used by pages, hooks, and components.
Route-specific request construction and response validation live in this folder.

Use the existing domain that matches the backend route family:

- `auth.ts`: login, registration, current user, logout.
- `behavior.ts`: todos, favorites, notes, history, feedback, actions, journal.
- `chat.ts`: chat execution, sessions, messages, and streaming.
- `content.ts`: content lists, content detail, daily digest, digest consult.
- `dashboard.ts`: Today dashboard loading.
- `preferences.ts`: interests, settings, profile, growth overview.
- `reports.ts`: report list and periodic report loading.
- `system.ts`: summary tasks and diagnostics/statistics endpoints.

Keep `api.ts` as a delegating facade. Add new endpoint logic here first, then expose it
through `api.ts` only when UI callers need the method.

For a new frontend API domain method, start from:

- `tools/templates/api/apiDomain.template.ts`
- `tools/templates/api/apiGuard.template.ts`
- `tools/templates/api/pageContract.template.ts`

The template keeps request construction, response validation, and shared contracts aligned.
