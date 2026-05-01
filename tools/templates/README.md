# Code Templates

These files are copy/generation templates for new managed code. They are not
compiled directly.

## Replacement Tokens

- `__Feature__`: PascalCase feature or page name, for example `Growth`.
- `__feature__`: kebab-case or lower camel feature prefix, for example `growth`.
- `__Domain__`: PascalCase backend/API domain name.
- `__domain__`: kebab-case or lower camel domain prefix.
- `__RouteBase__`: route path segment, for example `/growth`.

## Template Set

- `page/Page.template.tsx`: formal page composition.
- `page/usePageLogic.template.ts`: page interaction and loading hook.
- `page/PageStyle.template.css`: page-owned styles with a required prefix.
- `information-page/InformationPage.template.tsx`: formal composition for information-dense pages.
- `information-page/useInformationPageLogic.template.ts`: information flow hook with UI boundaries.
- `information-page/InformationPageStyle.template.css`: overview, primary story, grouped reading, and auxiliary layout styles.
- `mutation-page/MutationPage.template.tsx`: formal page composition for pages with writes.
- `mutation-page/useMutationPageLogic.template.ts`: filters, mutations, reload, and error flow.
- `mutation-page/MutationPageStyle.template.css`: write-heavy page styles with a required prefix.
- `component/BusinessComponent.template.tsx`: shared product widget.
- `component/UiComponent.template.tsx`: primitive UI component.
- `component/LayoutComponent.template.tsx`: reusable layout box.
- `api/apiDomain.template.ts`: frontend API domain method.
- `api/apiGuard.template.ts`: frontend response guard.
- `api/pageContract.template.ts`: shared page-data contract.
- `worker/route.template.ts`: thin Worker route.
- `worker/service.template.ts`: Worker service entrypoint.

`manifest.json` is the machine-readable template source. It defines template sets,
required tokens, and generated output paths.

Generate from templates with:

```bash
npm run generate:template -- page --Feature Growth --feature growth --dry-run
npm run generate:template -- information-page --Feature Briefing --feature briefing --dry-run
npm run generate:template -- mutation-page --Feature Actions --feature actions --dry-run
```

Use these templates before inventing a new structure.

Use `information-page` when a page has many content items and must separate user-facing
reading flow from processing metadata. The generated structure is:

1. overview: what changed overall;
2. primary story: the most important item;
3. grouped reading: user-facing groups and report cards;
4. auxiliary entries: actions, notes, conversation, or secondary navigation;
5. UI boundary list: data fields that must not leak into the main reading flow.
