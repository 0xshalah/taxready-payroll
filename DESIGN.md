# DESIGN.md — Tax-Ready Payroll

> Inspired by Supabase's design language. Adapted for a payroll/fintech SaaS dashboard.

## Overview

Tax-Ready Payroll's design language is engineered for clarity above all else. The marketing surfaces sit on `{colors.canvas}` (pure white), with text rendered in `{colors.ink}` (`#171717` — near-black, never pure black). Across the entire system the only consistent chromatic event is the **emerald green primary** (`{colors.primary}` — `#3ecf8e`) — used as the filled CTA, occasional accent dot, and the signature highlight color. Everything else is a calibrated grey ladder from `#ededed` hairline-cool to `#171717` ink, with thin black-on-white typography doing most of the visual work.

Typography runs **Inter** (open-source) at weight 500 for display and 400 for body. The display tier uses tight negative letter-spacing (-1.92px at 64px) to pull the rounded humanist letterforms into editorial density.

The product itself appears as clean dashboard tables, payroll summaries, and configuration panels. These sit inside `{rounded.lg}` 12px containers with subtle 1px hairlines.

**Key Characteristics:**
- Single emerald primary (`{colors.primary}` `#3ecf8e`) as the only chromatic event; everything else is monochrome.
- White canvas marketing track with greyscale hierarchy from `{colors.hairline-cool}` to `{colors.ink}`.
- Inter font at weight 500 with negative letter-spacing for display tiers.
- Dashboard tables, payroll summaries, and data cards are the dominant UI elements.
- Tight 6px / 8px button radii — square-ish, technical, never pill-shaped.
- Code blocks and configuration panels rendered in deep `{colors.canvas-night}` (`#1c1c1c`) with monospace inline code.
- Dark inverted surfaces used sparingly for featured/highlighted sections, not green — green is reserved for buttons and dot accents.

## Colors

### Brand & Accent
- **Emerald** (`{colors.primary}` — `#3ecf8e`): The signature CTA color. Filled-button background, brand accent, dot indicator.
- **Emerald Deep** (`{colors.primary-deep}` — `#24b47e`): Pressed-state lift of the primary.
- **Emerald Soft** (`{colors.primary-soft}` — `#4ade80`): Lighter emerald used in chart accents and success states.
- **Warning Amber** (`{colors.warning}` — `#f59e0b`): Validation warnings, payroll alerts.
- **Error Red** (`{colors.error}` — `#ef4444`): Error states, failed validation, negative values.
- **Info Blue** (`{colors.info}` — `#3b82f6`): Informational badges, links in data tables.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): Default page background.
- **Canvas Soft** (`{colors.canvas-soft}` — `#fafafa`): Alternating section bands, table row hover.
- **Canvas Night** (`{colors.canvas-night}` — `#1c1c1c`): Code blocks, dark panels, featured pricing tier.
- **Canvas Night Soft** (`{colors.canvas-night-soft}` — `#202020`): Slightly lifted dark for nested chrome.
- **Hairline** (`{colors.hairline}` — `#dfdfdf`): 1px borders on cards and tables.
- **Hairline Strong** (`{colors.hairline-strong}` — `#c7c7c7`): Slightly darker border for emphasis.
- **Hairline Cool** (`{colors.hairline-cool}` — `#ededed`): Fine chrome work, table dividers.

### Text
- **Ink** (`{colors.ink}` — `#171717`): Default body text. Near-black, never pure.
- **Ink Secondary** (`{colors.ink-secondary}` — `#212121`): Body emphasis.
- **Ink Mute** (`{colors.ink-mute}` — `#707070`): Secondary text and helper copy.
- **Ink Mute 2** (`{colors.ink-mute-2}` — `#9a9a9a`): Tertiary text.
- **Ink Faint** (`{colors.ink-faint}` — `#b2b2b2`): Disabled / placeholder text.
- **On Primary** (`{colors.on-primary}` — `#171717`): Text on the emerald primary fill — near-black, not white.
- **On Dark** (`{colors.on-dark}` — `#ffffff`): Text on canvas-night surfaces.

## Typography

### Font Family
Display and UI tier: **Inter** (open-source via Google Fonts) at weight 500 for display with negative letter-spacing. Body at weight 400.

Code blocks use **system mono** (`ui-monospace`, with Menlo / Monaco / Consolas fallbacks).

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xxl}` | 64px | 500 | 1.1 | -1.92px | Hero headline |
| `{typography.display-xl}` | 48px | 500 | 1.1 | -1.44px | Section opener |
| `{typography.display-lg}` | 36px | 500 | 1.15 | -0.72px | Page title |
| `{typography.display-md}` | 28px | 500 | 1.2 | -0.42px | Card title |
| `{typography.heading-lg}` | 22px | 500 | 1.2 | 0 | Compact heading |
| `{typography.heading-md}` | 18px | 500 | 1.4 | 0 | Section sub-heading |
| `{typography.body-lg}` | 18px | 400 | 1.55 | 0 | Lead paragraph |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default UI body |
| `{typography.button-md}` | 14px | 500 | 1.0 | 0 | Button label |
| `{typography.caption}` | 13px | 400 | 1.45 | 0 | Helper, footnote |
| `{typography.micro}` | 12px | 400 | 1.45 | 0 | Pill label, fine print |
| `{typography.code}` | 14px | 400 | 1.5 | 0 | Code block content |

### Principles
- **Weight 500 across display.** Mid-weight reads as engineered, not decorative.
- **Negative tracking on display.** -1.92px at 64px scaling proportionally down.
- **Mono for code.** System mono families — no proprietary mono webfont.

## Layout

### Spacing System
- **Base unit**: 8px (with 2 / 4 / 12 sub-tokens for fine work).
- **Tokens**: `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 24px · `{spacing.xxl}` 32px · `{spacing.huge}` 64px.
- **Section padding**: 64–96px on marketing surfaces.
- **Card internal padding**: 32px on feature/pricing cards.
- **Dashboard padding**: 24px page padding, 16px card internal padding.

### Grid & Container
- Dashboard uses a sidebar (240px) + main content area.
- Main content centers in a ~1200px max-width container.
- Data tables are full-width within the content area.
- Cards collapse 3-up → 2-up → 1-up at 1024 / 768 breakpoints.

### Whitespace Philosophy
The brand uses generous padding without atmospheric gradients — the white canvas is the design. Clean data tables and summary cards break up sections without requiring decoration.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat, 1px hairline | Default cards, table rows |
| 1 | `box-shadow: 0 1px 3px rgba(0,0,0,0.06)` | Subtle card lift |
| 2 | `box-shadow: 0 8px 24px rgba(0,0,0,0.08)` | Floating panels, dropdowns |
| 3 | `box-shadow: 0 16px 48px rgba(0,0,0,0.12)` | Modal overlays |

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Form inputs, hairline tags |
| `{rounded.sm}` | 6px | Buttons, code blocks |
| `{rounded.md}` | 8px | Compact cards, alerts |
| `{rounded.lg}` | 12px | Feature cards, dashboard panels |
| `{rounded.xl}` | 16px | Modal dialogs |
| `{rounded.full}` | 9999px | Pill tags, avatars, status dots |

## Components

### Buttons

**`button-primary-green`** — the signature CTA.
- Background `{colors.primary}`, text `{colors.on-primary}` (near-black, NOT white), type `{typography.button-md}`, padding `{spacing.sm} {spacing.lg}` (8px 16px), rounded `{rounded.sm}` 6px.
- Pressed state shifts to `{colors.primary-deep}`.

**`button-secondary-outline`** — outline alternative on white.
- Background `{colors.canvas}`, text `{colors.ink}`, 1px solid `{colors.hairline-strong}` border, same shape.

**`button-danger`** — destructive actions.
- Background `{colors.error}`, text white, same shape. Used sparingly for delete operations.

**`button-link`** — text-only inline button.
- Transparent background, text `{colors.ink}`, subtle underline on hover.

### Cards & Containers

**`card-dashboard`** — standard dashboard card.
- Background `{colors.canvas}`, padding `{spacing.xl}`, rounded `{rounded.lg}` 12px, 1px `{colors.hairline}` border.

**`card-summary`** — payroll summary metric card.
- Background `{colors.canvas}`, padding `{spacing.lg}`, rounded `{rounded.md}` 8px, 1px `{colors.hairline}` border. Large number in `{typography.display-md}`, label in `{typography.caption}` with `{colors.ink-mute}`.

**`card-alert-warning`** — validation warning card.
- Background `#fffbeb` (amber-50), border-left 4px solid `{colors.warning}`, padding `{spacing.lg}`.

**`card-alert-error`** — error state card.
- Background `#fef2f2` (red-50), border-left 4px solid `{colors.error}`, padding `{spacing.lg}`.

### Data Tables

**`table-default`** — standard data table for employee lists, payroll records.
- Header row: background `{colors.canvas-soft}`, text `{colors.ink-mute}` in `{typography.caption}` weight 500, uppercase.
- Body rows: background `{colors.canvas}`, text `{colors.ink}` in `{typography.body-md}`, 1px `{colors.hairline-cool}` bottom border.
- Hover: row background shifts to `{colors.canvas-soft}`.
- Currency values right-aligned, monospace rendering.

### Inputs & Forms

**`text-input`** — standard form input.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, padding `{spacing.sm} {spacing.md}` (8px 12px), rounded `{rounded.xs}` 4px, 1px `{colors.hairline}` border.
- Focus: border shifts to `{colors.primary}`, subtle `0 0 0 2px rgba(62,207,142,0.15)` ring.
- Error: border shifts to `{colors.error}`.

**`select-input`** — dropdown select.
- Same styling as text-input with chevron icon right-aligned.

### Navigation

**`sidebar-nav`** — dashboard sidebar.
- Background `{colors.canvas}`, width 240px, border-right 1px `{colors.hairline}`. Nav items: padding `{spacing.sm} {spacing.lg}`, rounded `{rounded.sm}`, text `{colors.ink-mute}`. Active item: background `{colors.canvas-soft}`, text `{colors.ink}`, font-weight 500.

**`top-bar`** — dashboard top bar.
- Background `{colors.canvas}`, border-bottom 1px `{colors.hairline}`, padding `{spacing.md} {spacing.xl}`. Company name left, user avatar + role badge right.

### Pills, Tags, and Status

**`pill-status-success`** — success/active status.
- Background `#ecfdf5` (emerald-50), text `#065f46` (emerald-800), rounded `{rounded.full}`, padding `{spacing.xxs} {spacing.sm}`, type `{typography.micro}`.

**`pill-status-warning`** — warning/review needed.
- Background `#fffbeb` (amber-50), text `#92400e` (amber-800), same shape.

**`pill-status-error`** — error/failed.
- Background `#fef2f2` (red-50), text `#991b1b` (red-800), same shape.

**`pill-role`** — user role badge.
- Background `{colors.canvas-soft}`, text `{colors.ink-mute}`, border 1px `{colors.hairline}`, same shape.

### Payroll-Specific Components

**`payroll-summary-bar`** — top summary after payroll processing.
- Horizontal row of `card-summary` items showing: Total Karyawan, Total Bruto, Total PPh 21, Total BPJS, Total Gaji Bersih.

**`employee-detail-panel`** — side panel for employee details.
- Slide-in from right, width 480px, background `{colors.canvas}`, Level 3 shadow, rounded-left `{rounded.xl}`.

**`validation-error-list`** — pre-payroll validation errors.
- List inside `card-alert-error`, each item shows employee name + field + error message.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` emerald for filled CTAs and success indicators — it should appear sparingly.
- Render display tiers at weight 500 with negative letter-spacing.
- Use `{rounded.sm}` 6px for buttons — square-ish radii, never pill-shaped.
- Right-align all currency values in tables with monospace rendering.
- Use near-black `{colors.ink}` on the emerald button (not white).
- Show validation errors inline next to the field AND in a summary list.
- Use `{colors.canvas-soft}` for alternating table rows or section backgrounds.

### Don't
- Don't introduce additional accent colors as system colors — amber and red are for states only.
- Don't bump display weight above 500.
- Don't use pill-shaped buttons; the brand's button radius is square-ish 6px.
- Don't use white text on the emerald button — use near-black on green.
- Don't add atmospheric gradients to any surface — the white canvas is the design.
- Don't left-align currency values in data tables.
- Don't use more than one filled green button per viewport section.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Wide | ≥ 1440px | Full sidebar + content; tables at full width |
| Desktop | 1024–1440px | Default layout; sidebar visible |
| Tablet | 768–1023px | Sidebar collapses to icons; tables scroll horizontally |
| Mobile | < 768px | Sidebar hidden (hamburger); cards stack 1-up; display drops to 36px |

### Touch Targets
- Buttons hit ≥ 36×36px on mobile.
- Form fields stay at 36px minimum height.
- Table rows have minimum 44px height on touch devices.

### Collapsing Strategy
- Display tiers stair-step 64 → 48 → 36 → 28 → 22px.
- Summary cards collapse from horizontal row to 2×2 grid to vertical stack.
- Data tables gain horizontal scroll on mobile rather than hiding columns.

## Iteration Guide

1. Focus on ONE component at a time.
2. Reference component names and tokens directly.
3. Default body to `{typography.body-md}`; use `{typography.code}` for any configuration/code snippet.
4. Keep emerald scarce; one filled green button per viewport.
5. The white-canvas commitment is non-negotiable.
6. Currency formatting: always use `Rp` prefix with thousand separators (Rp 10.000.000).
7. Date formatting: DD MMM YYYY (15 Jan 2026) for display, YYYY-MM-DD for data.
