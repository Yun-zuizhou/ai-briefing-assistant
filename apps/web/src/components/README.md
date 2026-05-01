# Frontend Component Interfaces

UI component access follows the same governance model as service/API access: callers use
explicit public interfaces, while implementation files stay behind those interfaces.

## Public Interfaces

- `components/ui`: primitive controls and feedback components.
- `components/layout`: app shell, page layout, headers, footer, and tab bar.
- `components/business`: reusable product/domain widgets shared by pages.
- `components/chat`: Chat page feature components.
- `components/decor`: formal editorial/decor components allowed in production UI.
- `components/decor/preview`: preview-only and experimental decor assets.

Start new components from the code templates before inventing a new shape:

- `tools/templates/component/UiComponent.template.tsx`
- `tools/templates/component/LayoutComponent.template.tsx`
- `tools/templates/component/BusinessComponent.template.tsx`

## Rules

- Pages import component packages through their public interface, for example
  `../components/ui`, `../components/layout`, or `../components/business`.
- Formal pages must not import implementation files such as
  `../components/ui/Button` or `../components/decor/BookishChip`.
- `components/decor/index.ts` is the formal decor interface. It must not export
  preview samples, migration samples, or exploratory Bookish controls.
- `components/decor/preview.ts` is the only public preview interface for decor experiments.
- Component internals may import sibling implementation files inside the same package, but
  cross-package imports should use the target package interface.
- A large business domain may become a small package under `components/business/<domain>/`.
  Keep the old caller-facing export stable through a facade file such as
  `components/business/reports.tsx`, and split internals by responsibility such as
  `periodic`, `annual`, `sheets`, `shared`, and `contracts`.
- Component `.tsx` files should export React components. Put shared types and constants in
  `.ts` files so Fast Refresh and module ownership remain clear.
- Business file growth is governed by `components/business/business-governance.json`.
  Large files must be registered as `monitor`, `package-candidate`, or `facade`; facades
  must stay thin and implementation-free. Update that registry when a file changes shape.
- Current business governance is in stabilize mode. Do not start broad cleanup passes.
  Only the registry's `activeCandidates` should be considered for package upgrades before
  deferred candidates. A new package is justified only when the registry's
  `packageCriteria` are met and the caller-facing facade stays stable.

## Layout Composition

- `components/layout` owns page skeleton and component mounting boxes:
  `PageLayout`, `PageContent`, `PageSection`, `PageStack`, and `PageGrid`.
- Pages decide section order and pass data; layout components decide spacing, headers,
  stacks, and grids; business components decide only their own internal content structure.
- Do not create new generic page structure classes such as `section-header` in pages.
  Promote repeated structure to `components/layout` instead.
- Section-level actions belong to `PageSection`'s `action` slot. Pages should pass
  normal UI controls, for example `Button variant="text"`; layout context owns the
  action styling. Do not reuse legacy page classes such as `section-more` inside new
  layout composition.
- Keep layout boxes low-option. Add a new prop only when at least two pages need the same
  structural variation.

## Decoration Ownership

- UX decides whether a visual mark carries meaning, grouping, emphasis, or only mood.
- Structural lines that separate a section header from its content belong to layout, for
  example `PageSection`'s header border.
- Lines inside a reusable component belong to that component.
- Brand or editorial ornaments belong to `components/decor` and must be exported through
  the formal or preview decor interface.
- Page-specific atmosphere belongs to the page style owner and must use that page prefix.

## Change Interface

- If a page needs a component from another package, add or reuse an export in that package
  `index.ts`; do not reach into the package implementation from the page.
- If a component becomes reusable across pages, move its public export to `components/business`
  instead of letting pages share a deep import path.
- If a preview component becomes formal product UI, promote it from `components/decor/preview.ts`
  to `components/decor/index.ts` and move its styles to the formal owner at the same time.
- If a component is only used by one page and has route-specific styling, keep the style
  prefix tied to the route instead of creating another global utility class.
