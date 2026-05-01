# UI Style Governance

The UI code is managed through explicit import interfaces, ownership boundaries, and
ratchets. File size is a symptom; the governing unit is the caller-facing interface.

## Layers

- `index.css`: stylesheet entrypoint only. It may import style files, define global resets, root tokens, and documented transitional legacy. Do not add page or component styles here.
- Foundation styles: `design-tokens.css`, `foundation.css`, `shell.css`, `navigation.css`, `surfaces.css`, and `status-ui.css`. These own app shell, primitives, global states, and reusable surface rules.
- Page styles: `*-page.css` and `*-pages.css`. These own route-specific layout and should use page prefixes such as `today-*`, `chat-*`, `report-*`, or `preferences-*`.
- Formal reusable components: component styles must use a component prefix and be safe in every route where the component is imported.
- Preview and experiment styles: preview selectors must stay isolated from formal UI and be imported by the preview route that owns them. Existing `preview-*` selectors are tracked as debt in `ui-governance-baseline.json`.

Component ownership lives in `apps/web/src/components/README.md`. Style layers must follow
those component interfaces: formal component styles belong to formal components, and preview
styles belong to preview-only entrypoints.

## Entrypoint Interface

`apps/web/src/index.css` imports styles in this order:

1. external framework and font imports;
2. foundation styles: `foundation.css`, shell, navigation, surfaces, status, and formal decor frame;
3. route/page styles;
4. no preview/experiment styles. Preview routes import their own styles locally.

That order is enforced by `tools/scripts/check-ui-governance.mjs`. Do not append imports to
`index.css` as a local fix. Pick the owning layer first, add the style file in the right
position, and keep selectors scoped to that owner. Preview styles are not part of this
entrypoint; import them from their preview page.

## Change Interface

- New primitive control: export it from `components/ui`; put reusable primitive styles in
  foundation/surface/status files.
- New shared surface: put the base rule in `surfaces.css`, document whether it is a
  formal primitive or legacy-compatible surface, and keep page-specific variants in the
  owning page/component prefix.
- New route-specific view: keep JSX under `pages`, import component packages through their
  public `index.ts`, and put route-only styles in a prefixed `*-page.css` file.
- New shared product widget: export it from `components/business`; do not make pages import
  its implementation file directly.
- New formal decor component: export it from `components/decor/index.ts`.
- New preview or experiment: export it only from `components/decor/preview.ts` and keep it off
  formal pages.
- Promoting preview to product UI: move the export from the preview interface to the formal
  interface, move or rename its styles out of preview ownership, then lower the baseline if
  debt was removed.

For new page styles, start from `tools/templates/page/PageStyle.template.css`. The template
is intentionally small: it fixes ownership and prefix shape without deciding page-specific
visual design.

## Decoration Lines

Decoration is not a free-floating style layer. Before adding a line, divider, underline, or
ornament, pick its owner:

- layout owns structural section separators;
- components own internal separators;
- decor owns reusable brand/editorial ornaments;
- pages own route-specific atmosphere with page-prefixed selectors.

If ownership is unclear, do not place the style in `index.css` or a generic selector. First
promote the needed box, component, or decor interface.

## Ratchet Rule

`tools/scripts/check-ui-governance.mjs` compares current UI debt against `ui-governance-baseline.json`.
When cleanup removes debt, lower the baseline. Do not raise the baseline for new work.

This turns UI governance into an executable boundary: new work cannot expand global entrypoint styles, preview leakage, generic `section-header` usage, or duplicate viewport shells.
