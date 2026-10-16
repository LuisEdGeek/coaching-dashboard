---
name: Deliberate KPIs
description: Warm ops scorecard for Deliberate Coaching beta metrics
colors:
  ink: "#1c1a22"
  ink-soft: "#4a4558"
  muted: "#5c5668"
  line: "rgba(28, 26, 34, 0.1)"
  yellow: "#fdd835"
  yellow-deep: "#fbc02d"
  violet: "#816dde"
  violet-deep: "#5f4fc4"
  violet-soft: "#ece9fa"
  pink: "#f7b3ca"
  cyan: "#99dee6"
  success: "#008857"
  success-soft: "#e6f6ef"
  danger: "#d63b44"
  danger-soft: "#ffedee"
  warning: "#b87a12"
  warning-soft: "#fcf6ec"
  surface: "rgba(255, 253, 243, 0.88)"
  surface-solid: "#fffdf3"
  page-bg: "#f3f0f8"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontWeight: 700
    letterSpacing: "-0.03em"
    lineHeight: 1.05
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.45
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "12px"
  md: "16px"
  lg: "18px"
  xl: "28px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "14px"
  lg: "28px"
  page-gutter: "16px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "14px 18px"
  button-ghost:
    backgroundColor: "rgba(255, 255, 255, 0.7)"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
  filter-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  metric-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  login-panel:
    backgroundColor: "{colors.surface-solid}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "36px 32px"
---

# Design System: Deliberate KPIs

## Overview

**Creative North Star: "Warm Ops Atelier"**

A monitoring board that feels like a sunlit studio desk, not a SOC bunker. Soft paper surfaces, Fraunces display figures, and violet/yellow atmosphere gradients carry Deliberate Coaching’s warmth into an Operate-mode scorecard for admins and stakeholders.

Density stays scannable: category grids of metric cards, a gaps board for instrumentation honesty, and pill filters for priority. Depth comes from translucent glass cards and one ambient page wash—not heavy chrome.

**Key Characteristics:**
- Warm paper + lilac page wash with yellow/violet/cyan radial atmosphere
- Fraunces for KPI figures and titles; Outfit for UI chrome
- Pill filters and status chips; soft 16–18px cards
- Alert state via border + soft danger wash (never color alone)

## Colors

Warm neutrals with a violet primary accent and yellow atmospheric energy.

### Primary
- **Studio Violet** (#816dde): accents, gap counts, “Needs” labels, soft fills (`#ece9fa`)
- **Signal Yellow** (#fdd835 / #fbc02d): atmosphere blobs, energy—not body text

### Secondary
- **Clearwater Cyan** (#99dee6): tertiary atmosphere only
- **Blush Pink** (#f7b3ca): reserved atmosphere accent

### Neutral
- **Near-Black Ink** (#1c1a22): primary text and solid CTAs
- **Soft Ink** (#4a4558): secondary copy
- **Muted Fog** (#7a7489): meta labels
- **Cream Paper** (#fffdf3 / translucent surface): panels and cards
- **Lilac Mist** (#f3f0f8): page ground

### Semantic
- **Success** (#00a86b), **Danger** (#fc5058 / soft #ffedee), **Warning** (#e6a23c)

**The One Accent Rule.** Violet carries UI emphasis; yellow is atmosphere, not large text fills.

## Typography

**Display Font:** Fraunces (Georgia fallback)  
**Body Font:** Outfit (system-ui fallback)

**Character:** Editorial display numbers with a calm sans UI—warm authority without dashboards’ default Inter/slate stack.

### Hierarchy
- **Display** (Fraunces, clamp ~2–2.75rem, tight tracking): page H1, metric values
- **Title** (Fraunces ~1.45–1.5rem): section / gaps headings
- **Body** (Outfit ~1rem / 0.9rem): questions, leads
- **Label** (Outfit 0.65–0.85rem, uppercase tracking): status pills, priority, “Needs”

**The Figurehead Rule.** Large numeric KPI values always use Fraunces; chrome never does.

## Layout

Centered column `min(1200px, 100% − 32px)`, vertical stack gap ~28px. Metric grids: `auto-fill` min 260px. Gaps board: 3 columns → 1 under 900px. Login: centered single panel ≤420px.

## Elevation & Depth

Hybrid: flat cream surfaces + one soft ambient shadow (`0 18px 40px rgba(47, 43, 61, 0.12)`) on the login panel; cards use blur + hairline border more than stacked shadows.

**The Glass Desk Rule.** Cards float on atmosphere via translucency and blur; avoid multi-layer drop-shadow stacks.

## Shapes

Generous softness: pills for filters/CTAs (999px), cards 16px, gaps panel 18px, login 28px, inputs 12px. Hairline `rgba(28,26,34,0.1)` borders; dashed top rule on gap footnotes.

## Components

### Buttons
- **Primary (login):** ink fill, white text, pill, 14×18 padding
- **Ghost (sign out):** translucent white, hairline border, pill
- **Filter chips:** transparent until `.is-active` → ink fill

### Cards / Containers
- **Metric card:** cream translucent, 16px radius, min-height 180px; critical priority soft danger gradient; alert = danger border ring
- **Gaps panel:** white translucent, blur, 18px radius

### Inputs / Fields
- White fill, 12px radius, hairline border; labels 0.85rem semibold soft-ink

### Status pills
- Live / SQL ready / Partial / Blocked with distinct soft fills (green / violet / warm / gray)

### Navigation
- No app shell nav; header is title + filter row + sign out

## Do's and Don'ts

### Do:
- **Do** keep Warm Ops Atelier (cream, violet, yellow atmosphere, Fraunces figures).
- **Do** label status with text pills, not color alone.
- **Do** show honest gaps when data is incomplete.
- **Do** preserve existing metric cards when expanding the catalog.

### Don't:
- **Don't** restyle into cold gray/blue “SOC” dashboards.
- **Don't** use Inter/Roboto/system-only stacks for display figures.
- **Don't** remove P0 metrics to “simplify” the board.
- **Don't** invent fixture values as if they were live API truth.
