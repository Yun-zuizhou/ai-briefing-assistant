---
version: alpha
name: AI简报助手 (AI Briefing Assistant)
description: "A bookish, editorial design system built on warm paper tones (#F5F2E8) and deep ink (#2C2416). The visual language borrows from vintage newspapers and Chinese literary aesthetics — serif display type (LXGW WenKai), muted gold accents (#8B6914), and a restrained crimson accent (#A63D2F) used sparingly for calls-to-action and structural marks. The system supports light and dark modes through CSS custom properties, with a three-tier ornament density toggle (subtle / classic / rich) that controls gilding, shadow strength, and border radius. All surfaces carry a faint paper noise texture and warm radial gradients. The primary canvas is a mobile-first 430px-wide column that expands to 1120px on desktop."

colors:
  # Paper (surface) tones
  paper: "#F5F2E8"
  paper-warm: "#EDE9DC"
  paper-dark: "#E5E0D0"
  surface-raised: "#FBF8F2"
  surface-soft: "#F1EBDF"

  # Ink (text) tones
  ink: "#2C2416"
  ink-light: "#5A4D3A"
  ink-muted: "#6C5E49"
  ink-reading: "#5F5240"

  # Accent
  accent: "#A63D2F"
  accent-dark: "#7F2F24"
  accent-light: "#F5E6E3"

  # Gold
  gold: "#8B6914"
  gold-light: "#F5EBD3"

  # Semantic
  semantic-success: "#2D5A27"
  semantic-warning: "#8B6914"
  semantic-error: "#8B2500"

  # Borders
  border: "#B8AE96"
  border-strong: "#8F8269"

  # Shadow overlay
  shadow-soft: "0 8px 20px rgba(44, 36, 22, 0.08)"

  # Dark mode overrides
  dark-paper: "#1C1A16"
  dark-paper-warm: "#242118"
  dark-paper-dark: "#2C2820"
  dark-ink: "#E8E0D0"
  dark-ink-light: "#B8AE96"
  dark-ink-muted: "#8F8269"
  dark-ink-reading: "#A69E8C"
  dark-accent: "#D4654E"
  dark-accent-dark: "#E8836E"
  dark-accent-light: "#3A2420"
  dark-gold: "#C9A43A"
  dark-gold-light: "#3A3018"
  dark-semantic-success: "#5A9A52"
  dark-border: "#4A4234"
  dark-border-strong: "#6C5E49"
  dark-surface-raised: "#282420"
  dark-surface-soft: "#201E18"

  # Bookish editorial tokens
  bookish-bg: "#F7F3EB"
  bookish-bg-select: "#F0E9DD"
  bookish-ink-primary: "#4A3F35"
  bookish-ink-secondary: "#7A6D60"
  bookish-ink-faint: "#A89A8C"
  bookish-gold: "#B89A46"
  bookish-border: "#E0D7C8"
  bookish-line-brown: "#8B5A2B"

typography:
  display-xl:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 32px
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: 0.02em
  display-lg:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 29px
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: 0.02em
  display-md:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 26px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: 0.02em
  headline:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: 0
  page-title:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 1.75rem
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: 0.05em
  section-title:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: 0.06em
  card-title:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 1rem
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0
  body:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  body-lg:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  meta:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 0.6875rem
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.04em
  micro:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  button:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 0.8125rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.02em
  eyebrow:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.14em
  label:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 0.625rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.13em
  stat-number:
    fontFamily: "'LXGW WenKai', serif"
    fontSize: 20px
    fontWeight: 900
    lineHeight: 1
    letterSpacing: 0

rounded:
  none: 0
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  panel: 10px
  root: 14px
  pill: 999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 48px

components:
  button-primary:
    backgroundColor: "linear-gradient(180deg, #b94f40 0%, {colors.accent} 100%)"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 10px 14px
    minHeight: 38px
  button-secondary:
    backgroundColor: "linear-gradient(180deg, #f8f4ea 0%, #efe8db 100%)"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 10px 14px
    minHeight: 38px
    borderColor: "rgba(143, 130, 105, 0.95)"
  button-soft:
    backgroundColor: "linear-gradient(180deg, rgba(245, 242, 232, 0.96) 0%, rgba(237, 233, 220, 0.88) 100%)"
    textColor: "{colors.ink-light}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 10px 14px
    minHeight: 38px
    borderColor: "rgba(143, 130, 105, 0.78)"
  button-text:
    backgroundColor: transparent
    textColor: "{colors.ink-muted}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 10px 14px
    minHeight: 38px
  button-capsule:
    backgroundColor: "linear-gradient(180deg, #b94f40 0%, {colors.accent} 100%)"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 10px 14px
    minHeight: 38px
  card-default:
    backgroundColor: "{colors.paper-warm}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: 14px
    borderColor: "{colors.border}"
  card-bordered:
    backgroundColor: "linear-gradient(180deg, {colors.paper-warm} 0%, {colors.paper} 100%)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: 14px
    borderColor: "{colors.border}"
  card-elevated:
    backgroundColor: "{colors.paper-warm}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: 14px
  input-default:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 11px 13px
    borderColor: "rgba(143, 130, 105, 0.82)"
  tag-default:
    backgroundColor: "rgba(237, 233, 220, 0.76)"
    textColor: "{colors.ink-light}"
    typography: "{typography.micro}"
    rounded: "calc({rounded.lg} - 2px)"
    padding: 4px 10px
  tag-accent:
    backgroundColor: "linear-gradient(180deg, #b54b3d 0%, {colors.accent} 100%)"
    textColor: "{colors.paper}"
    typography: "{typography.micro}"
    rounded: "calc({rounded.lg} - 2px)"
    padding: 4px 10px
  tag-gold:
    backgroundColor: "linear-gradient(180deg, #9a761e 0%, {colors.gold} 100%)"
    textColor: "{colors.paper}"
    typography: "{typography.micro}"
    rounded: "calc({rounded.lg} - 2px)"
    padding: 4px 10px
  masthead-editorial:
    backgroundColor: "{colors.paper-warm}"
    textColor: "{colors.ink}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.none}"
    padding: 12px 14px
    borderColor: "rgba(143, 130, 105, 0.8)"
  bottom-nav:
    backgroundColor: "linear-gradient(180deg, rgba(255, 244, 221, 0.08) 0%, transparent 36%), #32291b"
    textColor: "{colors.paper}"
    typography: "{typography.meta}"
    rounded: "{rounded.none}"
    height: 64px
  bottom-nav-paper:
    backgroundColor: "linear-gradient(180deg, rgba(255, 252, 244, 0.96), rgba(239, 229, 210, 0.94)), {colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.none}"
    height: 64px
  content-list-item:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 14px 0
    borderColor: "{colors.border}"
  action-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 8px 12px
    minHeight: 34px
  action-chip-primary:
    backgroundColor: "linear-gradient(180deg, #413627 0%, {colors.ink} 100%)"
    textColor: "{colors.paper}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 8px 12px
    minHeight: 34px
  action-chip-accent:
    backgroundColor: "linear-gradient(180deg, #B0493A 0%, {colors.accent} 100%)"
    textColor: "{colors.paper}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 8px 12px
    minHeight: 34px
  spot-light-card:
    backgroundColor: "rgba(255, 252, 244, 0.9)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: 16px
  surface-hero:
    backgroundColor: "linear-gradient(180deg, {colors.paper-warm} 0%, {colors.paper} 100%)"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.panel}"
    padding: 18px
    borderColor: "{colors.border}"
  chat-bubble-assistant:
    backgroundColor: "{colors.paper-warm}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 14px
    borderColor: "{colors.border}"
  chat-bubble-user:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 14px
  section-header:
    backgroundColor: transparent
    textColor: "{colors.ink-light}"
    typography: "{typography.section-title}"
    rounded: "{rounded.none}"
    padding: 0 0 8px
  confirm-modal:
    backgroundColor: "linear-gradient(180deg, rgba(245, 242, 232, 0.98) 0%, rgba(237, 233, 220, 0.92) 100%)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: 18px 16px
    maxWidth: 360px
  empty-state:
    backgroundColor: transparent
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 48px 24px
  confirm-modal-confirm-primary:
    backgroundColor: "linear-gradient(180deg, #413627 0%, {colors.ink} 100%)"
    textColor: "{colors.paper}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    minHeight: 38px
  confirm-modal-confirm-danger:
    backgroundColor: "linear-gradient(180deg, #B0493A 0%, {colors.accent} 100%)"
    textColor: "{colors.paper}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    minHeight: 38px
  domain-card:
    backgroundColor: "linear-gradient(180deg, {colors.paper-warm} 0%, {colors.paper} 100%)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    margin: 12px
  editorial-masthead-front:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    rounded: "{rounded.none}"
    padding: 14px 0
  editorial-masthead-section:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.display-md}"
    rounded: "{rounded.none}"
    padding: 12px 0 10px
  status-badge:
    backgroundColor: "rgba(224, 215, 200, 0.4)"
    textColor: "{colors.ink-light}"
    typography: "{typography.micro}"
    rounded: "{rounded.sm}"
    padding: 4px 9px
    minHeight: 28px
  status-badge-pending:
    backgroundColor: "rgba(184, 154, 70, 0.15)"
    textColor: "{colors.gold}"
    typography: "{typography.micro}"
    rounded: "{rounded.sm}"
    padding: 4px 9px
    minHeight: 28px
  status-badge-success:
    backgroundColor: "rgba(139, 90, 43, 0.08)"
    textColor: "{colors.gold}"
    typography: "{typography.micro}"
    rounded: "{rounded.sm}"
    padding: 4px 9px
    minHeight: 28px
  decoframe:
    backgroundColor: transparent
    textColor: inherit
    typography: inherit
    rounded: "{rounded.panel}"
    padding: 0
---

## Overview

AI简报助手 (AI Briefing Assistant) is a personal information digest tool that surfaces curated content, action items, growth insights, and AI-powered chat interactions. The design system is a **bookish-editorial hybrid** — it draws from Chinese vintage newspaper aesthetics, scholarly reading interfaces, and warm paper textures. The dominant visual metaphor is "ink on paper": deep brown-black text (`{colors.ink}` #2C2416) on warm cream-toned paper surfaces (`{colors.paper}` #F5F2E8).

The primary canvas is a **mobile-first 430px-wide column** (`#root` max-width), expanding to min(100%, 1120px) on desktop. All surfaces carry a subtle fractal noise texture (`feTurbulence` SVG filter at 3% opacity) layered over warm radial gradients. The typographic voice is **LXGW WenKai** (a Chinese serif webfont) used universally — headlines, body, labels, and buttons all draw from the same font family stack, differentiated by weight, size, and letter-spacing rather than typeface switching.

The system supports **light and dark themes** via `[data-theme="dark"]` on `:root`. A unique **three-tier ornament density control** (`data-ornament-level="subtle" | "classic" | "rich"`) governs gilding opacity, shadow strength, and border radius, allowing the same UI to scale from restrained to decorative without code changes.

Pages are composed from a small set of layout primitives (`PageLayout`, `PageSection`, `PageStack`, `PageGrid`), decorated with editorial components from `components/decor` (mastheads, dividers, datelines), and filled with business-domain cards. The chat interface extends the same bookish language with assistant/user bubbles, input bars, and editorial chat headers.

**Key Characteristics:**
- **Warm paper as the anchor surface** — `{colors.paper}` (#F5F2E8) is the default background, with a four-step surface ladder (paper → paper-warm → surface-raised → surface-soft).
- **Single-font system** — LXGW WenKai at weights 400, 500, 600, 700, 800, 900. No secondary typeface. Weight and spacing do the differentiation.
- **Crimson accent scarcity** — `{colors.accent}` (#A63D2F) used only for: primary CTAs, focus rings, structural left-border marks on section headers, and danger states.
- **Gold as a mood accent** — `{colors.gold}` (#8B6914) appears in dividers, decorative diamonds, nav indicators, and status badges — never as a primary action.
- **Three-tier ornament density** — `subtle` (minimal gild, soft shadows), `classic` (balanced), `rich` (gold-heavy, maximum shadow, generous radius).
- **Bottom navigation with four visual variants** — `ink` (dark bar, default), `paper` (light raised bar), `ledger` (notebook-style), `stamp` (postage-stamp edge).
- **Dashed borders as editorial grammar** — section dividers, domain headers, decor frames all use dashed lines (solid borders are for interactive elements).
- **Dark mode is a full color inversion** — paper becomes near-black (#1C1A16), ink becomes warm cream (#E8E0D0), accent warms up to #D4654E.

## Colors

### Paper (Surface)

- **Paper** (`{colors.paper}`): Default page background — warm cream #F5F2E8. The anchor of the entire system.
- **Paper Warm** (`{colors.paper-warm}`): One step above paper — card backgrounds, masthead fills. #EDE9DC.
- **Paper Dark** (`{colors.paper-dark}`): Deeper warm tone — used in shadows and bottom edges. #E5E0D0.
- **Surface Raised** (`{colors.surface-raised}`): Elevated panels — #FBF8F2.
- **Surface Soft** (`{colors.surface-soft}`): Muted background layers — #F1EBDF.

### Ink (Text)

- **Ink** (`{colors.ink}`): Primary text — deep brown-black #2C2416.
- **Ink Light** (`{colors.ink-light}`): Secondary text — #5A4D3A.
- **Ink Muted** (`{colors.ink-muted}`): Tertiary / placeholder / disabled — #6C5E49.
- **Ink Reading** (`{colors.ink-reading}`): Long-form reading text — #5F5240 (slightly warmer for comfort).

### Accent & Gold

- **Accent** (`{colors.accent}`): Crimson-red — primary CTA, focus rings, structural marks, danger states. #A63D2F.
- **Accent Dark** (`{colors.accent-dark}`): Deeper crimson — pressed states. #7F2F24.
- **Accent Light** (`{colors.accent-light}`): Pale pink — accent backgrounds, error states. #F5E6E3.
- **Gold** (`{colors.gold}`): Muted gold — dividers, decorative diamonds, nav indicators. #8B6914.
- **Gold Light** (`{colors.gold-light}`): Pale gold — gold tag backgrounds. #F5EBD3.

### Semantic

- **Success** (`{colors.semantic-success}`): Dark green #2D5A27 — success indicators.
- **Warning** (`{colors.semantic-warning}`): Gold-reused #8B6914 — warning states.
- **Error** (`{colors.semantic-error}`): Deep red #8B2500 — error states (distinct from accent).

### Borders

- **Border** (`{colors.border}`): Default 1px borders — warm gray #B8AE96.
- **Border Strong** (`{colors.border-strong}`): Emphasized borders — darker #8F8269.

### Dark Mode Palette

In dark mode (`[data-theme="dark"]`), all color tokens invert:
- Paper becomes near-black (#1C1A16), paper-warm becomes #242118.
- Ink becomes warm cream (#E8E0D0), ink-muted becomes #8F8269.
- Accent warms up to #D4654E; gold brightens to #C9A43A.
- Semantic success becomes #5A9A52.

### Bookish Editorial Palette

For editorial/decor components, a parallel set of tokens defines a slightly different mood:
- **bookish-bg** (#F7F3EB) — editorial page background, slightly warmer than paper.
- **bookish-ink-primary** (#4A3F35) — editorial primary text.
- **bookish-ink-secondary** (#7A6D60) — editorial secondary text.
- **bookish-ink-faint** (#A89A8C) — editorial tertiary / metadata.
- **bookish-gold** (#B89A46) — editorial gold accent for icons and active states.
- **bookish-border** (#E0D7C8) — editorial card borders.
- **bookish-line-brown** (#8B5A2B) — editorial decorative lines and kickers.

## Typography

### Font Family

All text uses **LXGW WenKai** (霞鹜文楷), a Chinese serif webfont loaded from CDN. The font is used universally — headlines, body, labels, buttons — with weight and spacing as the sole differentiators.

Fallback stack: `'LXGW WenKai', serif` for all tokens.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 32px | 900 | 1.15 | 0.02em | Front-page editorial title |
| `{typography.display-lg}` | 29px | 800 | 1.15 | 0.02em | Section editorial titles |
| `{typography.display-md}` | 26px | 800 | 1.1 | 0.02em | Compact editorial titles |
| `{typography.headline}` | 22px | 800 | 1.35 | 0 | Hero headlines, spot cards |
| `{typography.page-title}` | 1.75rem | 900 | 1.3 | 0.05em | Page masthead titles |
| `{typography.section-title}` | 0.875rem | 600 | 1.45 | 0.06em | Section headers (with accent bar) |
| `{typography.card-title}` | 1rem | 700 | 1.5 | 0 | Content card titles |
| `{typography.body}` | 0.9375rem | 400 | 1.45 | 0 | Default body text |
| `{typography.body-lg}` | 1rem | 400 | 1.5 | 0 | Lead paragraphs |
| `{typography.body-sm}` | 0.8125rem | 400 | 1.5 | 0 | Card body, secondary text |
| `{typography.meta}` | 0.6875rem | 400 | 1.4 | 0.04em | Metadata, timestamps |
| `{typography.micro}` | 0.75rem | 400 | 1.4 | 0 | Tags, badges |
| `{typography.button}` | 0.8125rem | 600 | 1.2 | 0.02em | All button labels |
| `{typography.eyebrow}` | 11px | 700 | 1.3 | 0.14em | Section eyebrows, kickers |
| `{typography.label}` | 0.625rem | 600 | 1.4 | 0.13em | Masthead labels, uppercase taxonomy |
| `{typography.stat-number}` | 20px | 900 | 1 | 0 | Stat tiles, big numbers |

### Characteristic Sets

The typography system defines four "characteristic" type classes in CSS:

- **type-page-title**: `{typography.page-title}` — serif, weight 900, letter-spacing 0.05em.
- **type-content-title**: serif, weight 700, line-height 1.5 — card and content headings.
- **type-stat-number**: serif, weight 900, line-height 1 — large numeric displays.
- **type-hero-copy**: serif, line-height 1.7 — long-form hero paragraphs.

### Principles

- **Single font, many weights** — LXGW WenKai at 400/500/600/700/800/900. No secondary typeface.
- **Weight does the hierarchy** — 900 for page titles, 800 for editorial/hero, 700 for card titles, 600 for buttons/section headers, 400 for body.
- **Letter-spacing is structural** — section titles get 0.06em for a "typeset" feel; eyebrows get 0.14em for taxonomy emphasis; body stays at 0.
- **Line-height scales with size** — display at 1.1–1.15 (tight), body at 1.45 (comfortable), meta at 1.4 (compact).
- **No italic, no oblique** — emphasis is conveyed through weight and color, not slant.

### Font Substitute

LXGW WenKai is an open-source font. If unavailable (offline), fall back to system serif: `Georgia, 'Noto Serif CJK SC', 'Source Han Serif SC', serif`.

## Layout

### Canvas

The app root (`#root`) is:
- **Mobile**: `width: min(100%, 430px); max-width: 430px; height: 100dvh`
- **Desktop (≥768px)**: `width: min(100%, calc(100vw - 48px)); max-width: 1120px`

Content scrolls within a flex column: `masthead → main (flex: 1, overflow: auto) → bottom-nav`.

### Spacing System

- **Base unit**: 4px.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 20px · `{spacing.xl}` 24px · `{spacing.xxl}` 32px · `{spacing.section}` 48px.
- Card interior padding: 14px (default), 18px (large), 10px (small).
- Button padding: 10px 14px (default), 7px 10px (sm), 12px 18px (lg).
- Section gaps: 12–16px between sections; 48px between major page sections.
- Page footer: 20px padding, with `env(safe-area-inset-bottom)` bottom offset.

### Grid Patterns

- **Page stack**: `display: grid; gap: 16px` — standard vertical stacking.
- **Page grid**: `display: grid; gap: 8px` — tighter content grids.
- **Page section**: `display: grid; gap: 12px` — section-level content grouping.
- **Card grids**: mobile single-column; desktop adapts to 2-up or 3-up via `grid-template-columns: repeat(auto-fit, minmax(...))`.

### Whitespace Philosophy

Whitespace is carried by the paper surface itself. Sections separate via dashed border-bottom dividers rather than large gaps. Within sections, 12–16px gaps create breathing room. The masthead and bottom-nav bookend the scrollable content area.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No shadow, no border | Body text, section headers, inline content |
| 1 (card soft) | `{colors.shadow-soft}` — 0 8px 20px rgba(44,36,22,0.08) | Default cards, article items |
| 2 (card mid) | 0 10px 22px rgba(44,36,22,0.1) | Hovered cards, selected items |
| 3 (card strong) | 0 14px 28px rgba(44,36,22,0.14) | Modal overlays |
| 4 (accent) | 0 10px 20px rgba(166,61,47,0.18) | Primary buttons, accent chips |

The system has named elevation CSS variables:
- `--elevation-card-soft`: 0 6px 14px rgba(44, 36, 22, 0.06)
- `--elevation-card-mid`: 0 10px 22px rgba(44, 36, 22, 0.1)
- `--elevation-card-strong`: 0 14px 28px rgba(44, 36, 22, 0.14)
- `--elevation-accent-mid`: 0 10px 20px rgba(166, 61, 47, 0.18)
- `--surface-shadow`: 0 18px 42px rgba(44, 36, 22, 0.14)
- `--shadow-soft`: 0 8px 20px rgba(44, 36, 22, 0.08)

### Decorative Depth

- **Offset shadows** on tags: `2px 2px 0 var(--paper-dark)` — a print-like offset effect.
- **Inset gild highlights** on ornate surfaces: `inset 0 0 0 1px rgba(255, 255, 255, 0.2)`.
- **Inner dashed borders** on hero surfaces and decor frames — a vintage frame-within-a-frame.
- **Paper noise texture**: SVG `feTurbulence` filter at 1–3.2% opacity (controlled by `--ornament-paper-noise-opacity`).

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0 | Mastheads, section headers |
| `{rounded.xs}` | 2px | Scrollbar thumb, trend bars |
| `{rounded.sm}` | 4px | Small elements, form focus rings |
| `{rounded.md}` | 6px | Status badges |
| `{rounded.lg}` | 8px | Buttons, inputs, action chips, tags |
| `{rounded.xl}` | 12px | Modals, spotlight cards |
| `{rounded.panel}` | 10px | Cards, domain panels, surface-hero |
| `{rounded.root}` | 14px | Root-level containers |
| `{rounded.pill}` | 999px | Capsule buttons |
| `{rounded.full}` | 9999px | Circular checkin marks |

Radius values are responsive to ornament level: `classic` uses the defaults above; `subtle` reduces all radii by ~2px; `rich` increases by ~2px.

### Decorative Geometry

- **Section title accent bar**: 3px wide × 14px tall vertical bar in `{colors.accent}`, positioned to the left of section titles.
- **Domain header diamonds**: `◆` character before and after domain names.
- **Checkin mark circles**: 64px diameter, 2px `{colors.accent}` border, circular.
- **Page footer diamonds**: 6px rotated squares in `{colors.gold}`.
- **Masthead title**: centered, flanked by gradient divider lines (transparent → border → transparent).

## Ornament System

The ornament system is a unique feature — a CSS custom property cascade that adjusts visual richness across three tiers:

| Property | subtle | classic | rich |
|---|---|---|---|
| `--ornament-paper-noise-opacity` | 0.01 | 0.02 | 0.032 |
| `--ornament-gild-opacity` | 0.3 | 0.52 | 0.76 |
| `--ornament-shadow-strength` | 0.1 | 0.16 | 0.24 |
| `--ornament-frame-opacity` | 0.32 | 0.52 | 0.72 |
| `--ornament-dash-opacity` | 0.62 | 0.86 | 1 |
| `--ornament-inner-shadow-strength` | 0.04 | 0.08 | 0.12 |
| `--ornament-header-highlight-opacity` | 0.12 | 0.22 | 0.36 |
| `--radius-root` | 12px | 14px | 16px |
| `--radius-panel` | 8px | 10px | 12px |
| `--radius-control` | 7px | 8px | 10px |

These variables cascade into all decorated surfaces — the gild opacity affects inset white highlights, the shadow strength scales card shadows, and the radius variables control all border-radius values.

## Components

### Buttons

**`button-primary`** — Crimson CTA. The default primary action button.
- Background gradient `#b94f40 → {colors.accent}`, text `{colors.paper}`, typography `{typography.button}`, padding 10px 14px, min-height 38px, rounded `{rounded.lg}`.
- Hover: gradient shifts to `#a94436 → #8f2f23`, lifts by 1px, shadow elevates to `--elevation-accent-mid`.
- Active: drops by 1px, shadow reduces.
- Disabled: muted gradient `#b58f88 → #9c7771`, no shadow.

**`button-secondary`** — Warm paper button. Default secondary action.
- Background gradient `#f8f4ea → #efe8db`, text `{colors.ink}`, border `rgba(143, 130, 105, 0.95)`, typography `{typography.button}`, padding 10px 14px, min-height 38px, rounded `{rounded.lg}`.

**`button-soft`** — Lighter paper button.
- Background `rgba(245, 242, 232, 0.96) → rgba(237, 233, 220, 0.88)`, text `{colors.ink-light}`, border `rgba(143, 130, 105, 0.78)`.

**`button-text`** — Borderless text-only button.
- Transparent background, text `{colors.ink-muted}`, no border, no shadow.
- Hover: `rgba(237, 233, 220, 0.72)` background, border appears at 0.5 opacity.

**`button-capsule`** — Pill-shaped CTA.
- Same as `button-primary` but `{rounded.pill}`.

**Size variants** (all button types):
- `sm`: min-height 32px, padding 7px 10px, font-size 0.75rem.
- `md` (default): min-height 38px, padding 10px 14px, font-size 0.8125rem.
- `lg`: min-height 44px, padding 12px 18px, font-size 0.875rem.

**Touch targets**: All buttons have ≥40px tap height on mobile.

### Cards

**`card-default`** — Standard warm-paper card.
- Background `{colors.paper-warm}`, border 1px `{colors.border}`, rounded `{rounded.panel}`, padding 14px.
- Active: translateY(1px), shadow reduces.
- Size variants: `card-sm` (padding 10px, radius -2px), `card-lg` (padding 18px).

**`card-bordered`** — Gradient card with border.
- Background gradient `{colors.paper-warm} → {colors.paper}`, border 1px `{colors.border}`, overflow hidden.

**`card-elevated`** — Card with elevated shadow and inset gild.
- Combined `--elevation-card-mid` shadow + inset white highlight at gild opacity.

**`domain-card`** — Legacy full-width domain panel.
- Gradient background, 12px margin, ornate header with diamond separators and repeating dash patterns.

**`spotlight-card`** — High-attention featured card.
- Background `rgba(255, 252, 244, 0.9)`, left border 4px solid `rgba(104, 119, 96, 0.58)`, padding 16px.
- Radial gradient glow at top right.

### Inputs

**`input-default`** — Text input field.
- Background `{colors.paper}`, border `rgba(143, 130, 105, 0.82)`, rounded `{rounded.lg}`, padding 11px 13px, min-height 42px.
- Inner shadow: `inset 0 1px 0 rgba(255, 255, 255, 0.55)`.
- Placeholder: `{colors.ink-muted}` at 0.82 opacity.
- Variants: `single` (42px), `multi` (textarea, min-height 80px), `search` (with search icon).

**`newspaper-search`** — Decorative search bar.
- Gradient background, border, inner shadow, rounded `{rounded.lg}`.

### Tags

**`tag-default`** — Neutral inline tag.
- Background `rgba(237, 233, 220, 0.76)`, text `{colors.ink-light}`, border `rgba(143, 130, 105, 0.78)`, rounded `calc({rounded.lg} - 2px)`, padding 4px 10px, font-size 0.75rem, font-weight 600.

**`tag-accent`** — Crimson tag.
- Background gradient `#b54b3d → {colors.accent}`, text `{colors.paper}`.

**`tag-gold`** — Gold tag.
- Background gradient `#9a761e → {colors.gold}`, text `{colors.paper}`.

**`tag-soft`** — Muted tag.
- Light gradient background, lighter border, inner gild highlight.

**`tag-outline`** — Dashed border tag.
- Transparent background, dashed border, `{colors.ink-muted}` text.

### Navigation

**`bottom-nav`** — Fixed bottom tab bar with 5 tabs (对话/简报/待办/成长/我的).
- Height 64px, plus `env(safe-area-inset-bottom)`.
- Four visual variants selectable at runtime:

  **`ink`** (default): Dark bar — background `linear-gradient(...) #32291b`, text `{colors.paper}`, gold top-line gradient. Active tab: subtle surface lift.
  
  **`paper`**: Light raised bar — background `{colors.paper}`, text `{colors.ink}`, dashed top ornament. Active tab: pill-highlighted with gold border and shadow.
  
  **`ledger`**: Notebook-style — warm cream gradient, brown accents. Active tab: accent left-border indicator.
  
  **`stamp`**: Postage-stamp edge — dot-pattern background, dashed top border. Active tab: accent border with 6px offset shadow.

- Nav button: flex column (icon 22px + label), gap 3px, min-height 52–58px.

**`masthead`** — Page header.
- Background `{colors.paper-warm}`, bottom border 1px `rgba(143, 130, 105, 0.8)`, padding 12px 14px.
- SVG noise texture overlay at 30% opacity.
- Title: `clamp(1.35rem, 5.3vw, 1.75rem)`, weight 900, letter-spacing 0.06em, centered.
- Ornament + divider + meta three-segment layout.
- `masthead-retained` variant: golden radial gradient, richer gild, used for special pages.
- `masthead-secondary` variant: adds back-button on the left, supports compact mode.

### Chat Components

**`chat-bubble-assistant`** — AI assistant message.
- Background `{colors.paper-warm}`, border 1px `{colors.border}`, rounded `{rounded.lg}`, padding 14px.
- Decorative diamond mark at top-left.

**`chat-bubble-user`** — User message.
- Background `{colors.accent}`, text `{colors.paper}`, offset shadow.

**`chat-input-area`** — Message input bar.
- Grid layout: 20px icon | 1fr input | 34px send button.
- Background gradient, border, inner highlight, rounded `{rounded.lg}`, min-height 46px.

**`chat-editorial-head`** — Chat page editorial header.
- Masthead with compact layout, history trigger button (38px rounded square).

### Decor Components (Formal)

Formal decor components exported from `components/decor/index.ts`:

- **`EditorialMasthead`**: Vintage newspaper masthead with eyebrow, title row (flanked by EditorialIcons), meta grid (3-column), and subtitle. Variants: `front` (32px title), `section` (26px title, left-aligned), `compact` (20px title).
- **`SectionHeader`**: Centered section heading with subtitle-eyebrow above and title below.
- **`DecorFrame`**: Container with dashed inner border (6px inset, `rgba(143, 130, 105, 0.38)`).
- **`Dateline`**: Newspaper-style dateline row — `◆ LABEL · TIME`.
- **`OrnamentDivider`**: Horizontal divider with optional gold symbol in center.
- **`PaperButton`**: Editorial-style button with bookish-bg, bookish-border, and gold active state.
- **`PageSectionHeader`**: Section header with accent bar, title, and action slot (for "more" buttons).
- **`StatusBadge`**: Small status pill — variants: `pending` (gold), `success` (brown), `neutral` (gray).
- **`EditorialIcon`**: Named icon set (chevron, diamond, star, etc.) rendered as SVG with `vector-effect: non-scaling-stroke`.

### Feedback & Status

**`empty-state`** — Centered empty state.
- Padding 48px 24px, flex column, centered.
- Icon shell: 80px rounded square (24px radius), soft gradient background, border.
- Title: 17px weight 700, `{colors.ink}`.
- Description: 14px, `{colors.ink-muted}`, max-width 260px.
- Optional action button: dark ink gradient, 40px height.
- Variants: `default` (Inbox icon), `loading` (Search icon, gold border), `error` (FileX icon, accent border).

**`confirm-modal`** — Centered modal dialog.
- Overlay: fixed, `rgba(44, 36, 22, 0.38)` background.
- Modal: max-width 360px, warm gradient background, dashed inner frame, enter animation (scale + fade).
- Title: 16px weight 700.
- Message: 12px, `{colors.ink-muted}`, line-height 1.7.
- Actions: 2-column grid (cancel + confirm). Confirm variants: `primary` (ink gradient), `danger` (accent gradient), `warning` (gold gradient).
- Mobile: bottom-sheet style (border-radius top only, slide-up animation).

**`error-toast`** — Floating error notification.
- Positioned top-center, max-width min(420px, calc(100vw - 28px)).
- Warm paper background, border, shadow. Icon shell + text + retry button + close.

**`loading-spinner`** — Spinning loader.
- Circular shell with warm gradient background and gold border.
- Accent-colored spinning icon (0.9s linear infinite).
- Size variants: `sm` (40px), `md` (60px), `lg` (80px).

### Action Chips

**`action-chip`** — Compact action button.
- Background `{colors.paper}`, border `{colors.border}`, rounded `{rounded.lg}`, padding 8px 12px, min-height 34px, font-size 12px, font-weight 600.
- Inset gild highlight at ornament opacity.
- Hover: border → `{colors.ink}`, lift 1px.
- Variants: `primary` (ink gradient, white text), `accent` (accent gradient, white text).

## Animation

### Keyframes

- **`fadeIn`**: opacity 0 → 1, 0.4s ease-out.
- **`slideUp`**: opacity 0 + translateY(20px) → opacity 1 + translateY(0), 0.5s ease-out.
- **`panel-rise`**: opacity 0 + translateY(8px) → opacity 1 + translateY(0) — used for emerging panels.
- **`spin`**: rotate 0 → 360deg, 0.9s linear infinite — loading spinners.
- **`typingDot`**: 1.4s cycle, staggered delays (0s, 0.2s, 0.4s) — typing indicator dots.
- **`confirm-modal-enter`**: opacity 0 + translateY(10px) scale(0.98) → full, 0.24s ease.
- **`confirm-modal-sheet-enter`**: opacity 0 + translateY(28px) → full — mobile bottom sheet.
- **`rise-fade-in`**: opacity 0 + translateY(8px) → full, 0.28s/0.35s ease-out.

### Transition Tokens

- `fast`: 0.1s ease — micro-interactions.
- `normal`: 0.2s ease — buttons, cards, nav items.
- `slow`: 0.3s ease — page transitions.

### Interactive Micro-animations

- **Button hover**: translateY(-1px), shadow elevation, 0.18s ease.
- **Button active**: translateY(1px), shadow reduction, 0.18s ease.
- **Card active**: translateY(1px), shadow reduction, 0.2s ease.
- **Article item active**: left-border accent bar expands (height 0 → 60%).
- **Nav button active**: bottom gold line expands (width 0 → 20px).
- **Checkin mark hover**: translateY(-1px), shadow increases.

### Reduced Motion

`@media (prefers-reduced-motion: reduce)` sets all animation and transition durations to 0.01ms.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | ≤767px | Single column, buttons 40px min-height, bottom-nav 58px touch targets |
| Desktop | ≥768px | #root expands to min(100%, calc(100vw - 48px)), max 1120px |
| Desktop XS | ≥760px | Card grids go 2-up, stat grids go 4-up |
| Tablet Short | ≥768px ∧ height≤720px | Bottom-nav compresses to 56px, nav icons shrink to 20px |

### Touch Targets

- Buttons: ≥40px on mobile, 38px on desktop.
- Nav buttons: ≥58px on mobile, ≥52px on desktop.
- Action chips: ≥40px on mobile.
- Form inputs: ≥42px on mobile.
- Back button: ≥38px on mobile.

### Collapsing Strategy

- **Card grids**: single-column mobile → 2-up at 760px → 3-up at wider widths.
- **Page action bar**: flex-wrap, children go `flex: 1 1 calc(50% - 4px)` when wrapping.
- **Confirm modal**: centered dialog on desktop → bottom-sheet on mobile (≤767px).
- **Masthead**: compact variant reduces title size and padding on small screens.

## Icons

The app uses **Lucide React** (`lucide-react`) as the primary icon library. All icons are rendered at 22px with `strokeWidth={2.1}` for navigation, and variable sizes elsewhere.

### Navigation Icons (TabBar)
- **Newspaper** — 简报 (Briefing)
- **MessageCircle** — 对话 (Chat)
- **CheckSquare** — 待办 (Todos)
- **TrendingUp** — 成长 (Growth)
- **User** — 我的 (Profile)

### UI Icons (EmptyState, etc.)
- **Inbox** — empty default
- **Search** — empty loading
- **FileX** — empty error
- **UserX** — empty profile

### Custom SVG Icons
The `components/icons/` directory contains 28 custom SVG icons for specific UI needs: arrow-left, bell, book-open, bookmark, chevron-down/right/up, clock, external-link, help-circle, home, info, log-out, message-square, pen-line, plus, search, send, settings, shield, sparkles, target, trash-2, trending-up, user, x.

### Editorial Icons
The `EditorialIcon` component provides a named icon set rendered as inline SVGs with `vector-effect: non-scaling-stroke`. Used in mastheads, dividers, and decorative contexts.

## Do's and Don'ts

### Do

- Use `{colors.paper}` (#F5F2E8) as the anchor surface — the warm cream tone is intentional.
- Use `{colors.accent}` (#A63D2F) sparingly: primary CTA, focus rings, section accent bars, danger states.
- Use `{colors.gold}` (#8B6914) for decorative mood: dividers, diamonds, nav indicators, pending badges.
- Apply the three-tier ornament system (`subtle`/`classic`/`rich`) rather than hardcoding values.
- Differentiate hierarchy through font weight (400 → 600 → 700 → 800 → 900) — not typeface changes.
- Use dashed borders for editorial/structural separators; solid borders for interactive elements.
- Maintain the 430px → 1120px canvas constraint via `#root`.
- Compose pages from layout primitives (`PageLayout`, `PageSection`, `PageStack`, `PageGrid`).
- Export new reusable components through package `index.ts` interfaces.
- Use `env(safe-area-inset-bottom)` for bottom-padded elements.

### Don't

- Don't introduce a second chromatic accent beyond crimson and gold.
- Don't use pure white (`#FFFFFF`) or pure black (`#000000`) — always use the paper/ink token scale.
- Don't add box-shadows to flat text or section headers.
- Don't use pill-radius (`999px`) on primary CTAs — reserve for capsule buttons and status badges.
- Don't skip ornament levels — choose one and apply consistently.
- Don't use italic or oblique type styles.
- Don't import component implementation files directly from pages — use package interfaces.
- Don't create new generic CSS utility classes in page stylesheets.
- Don't combine multiple decorative techniques (gild + noise + inner border + radial glow) on a single surface without purpose.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | ≤767px | Single column, 40px+ touch targets, bottom-sheet modals |
| Mobile S | ≤420px | Editorial surfaces lose padding, route maps collapse to 1-col |
| Desktop | ≥768px | #root expands, 2-up+ grids, centered dialogs |
| Desktop Wide | ≥760px | 4-up stat grids, 2-up preview grids |
| Short viewport | ≥768px ∧ ≤720px | Compressed bottom-nav (56px) |

### Touch Targets

- All interactive elements maintain ≥40px tap height on mobile.
- Bottom-nav buttons: ≥58px on mobile.
- Back button: ≥38px on mobile.
- Form inputs: ≥42px.

### Image & Decoration

- SVG noise textures are embedded as data URIs — no external image requests.
- LXGW WenKai font loaded via CDN with system serif fallback.
- All decorative elements (diamonds, dividers, ornaments) are CSS-only — no image assets.

## Iteration Guide

1. Start from `{colors.paper}` as the default surface. Only lift to `{colors.paper-warm}` when the element needs visual separation.
2. Default body text to `{typography.body}` (0.9375rem, weight 400).
3. When introducing a new section, use layout primitives (`PageSection` with `title` and optional `action` slot) before inventing custom structure.
4. Add new button variants as CSS class modifiers (`.btn-*`), not as new component types.
5. Reference token names directly in CSS via `var(--token)` — do not hardcode hex values.
6. Choose an ornament level for each page and use its variables (`--ornament-*`) consistently.
7. Export new reusable components through the appropriate package `index.ts`.
8. Run lint checks: avoid preview CSS in production pages, keep `index.css` class selectors under the governance limit.

## Known Gaps

- **Hover states** are partially documented — focus is on Default and Active/Pressed states. Hover is defined for buttons and cards but not exhaustively for all components.
- **Form validation and error styling** is not fully captured — error toasts exist but inline field validation patterns vary.
- **The `bookish-decor.css` file** contains both formal decor components and preview-only styles. The split is governed by `ui-governance-baseline.json`.
- **Some legacy class names** (e.g. `domain-*`, `newspaper-*`) predate the formal layout composition system and coexist with the newer `PageSection`/`PageStack` primitives.
- **Font loading states** (FOUT/FOIT) are not explicitly handled — the CDN-loaded LXGW WenKai may flash system serif on slow connections.
- **The dark mode palette** is defined in `design-tokens.css` but not all component-level styles have been verified against it — some gradient hardcoded values may not invert correctly.
- **Animation durations** assume 0.2–0.5s defaults. Custom animation curves (cubic-bezier) are not used — all transitions use `ease` or `ease-out`.
- The design system was extracted from a live React + CSS codebase. Some component internals reference implementation-specific patterns (`lucide-react`, React hooks) that are not part of the pure design spec.
