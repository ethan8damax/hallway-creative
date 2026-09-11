---
name: HallWay Creative
description: Cinematic, confident, understated photography and videography portfolio for Andrew Hall.
colors:
  bg: "oklch(0.09 0 0)"
  surface: "oklch(0.15 0 0)"
  ink: "oklch(0.95 0 0)"
  muted: "oklch(0.62 0 0)"
  tally-red: "oklch(0.56 0.19 25)"
  tally-red-deep: "oklch(0.42 0.18 25)"
  tally-red-text: "oklch(0.66 0.18 25)"
  monitor-blue: "oklch(0.72 0.09 230)"
  border: "oklch(0.24 0 0)"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.75rem, 6vw, 5.5rem)"
    fontWeight: 340
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.75rem, 3vw, 2.75rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "2px"
  md: "4px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.tally-red}"
    textColor: "{colors.bg}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.tally-red-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
---

# Design System: HallWay Creative

## 1. Overview

**Creative North Star: "The Screening Room"**

HallWay Creative is a private screening room, not a storefront. The room is dark by default — near-black walls, no glare — because that's the condition under which photography and film actually read as intentional rather than decorative. Into that dark room, exactly one signal is allowed to be loud: the tally light, the red indicator that lights up on a video camera the instant it starts recording. Everywhere else, the interface stays quiet, deferential, out of the way, so the work fills the frame.

This system explicitly rejects the photographer-template playbook: no stock-photo hero carousels, no "trusted by" logo rows, no SaaS hero-metric stat blocks, no tiny uppercase eyebrows stamped above every section, no gradient text, no side-stripe accent borders, no identical icon-card grids. Confidence here comes from restraint, not volume — a large well-composed photograph and a single deliberate red accent will always out-signal five decorated UI flourishes.

Light mode exists as a fully realized second surface — daylight through the same screening room, same identity, same tally-light red — for contexts (print-adjacent, daytime browsing, user preference) where dark isn't wanted. It is not a stripped-down fallback; every rule in this document applies to both.

**Key Characteristics:**
- Near-black resting state; pure white as the fully-realized light counterpart.
- One saturated accent (the tally-light red), used on under ~10% of any given screen — CTAs, active nav state, the one signal that says "this matters."
- Editorial serif display type (Fraunces) carries all the personality; body/UI type (Inter) stays quiet and gets out of the way.
- Flat by default. Depth comes from tonal layering (surface vs. bg), not drop shadows.

## 2. Colors

Two fully-specified themes sharing one identity. Dark is the default; light is not a lesser mode.

### Primary
- **Tally-Light Red** (`oklch(0.56 0.19 25)` dark mode / `oklch(0.42 0.18 25)` light mode): The recording indicator. Reserved for the contact CTA, the active portfolio-category tab, and one hero moment per page. Never used for decoration or repeated for emphasis — its rarity is the point. **Text variant** (`oklch(0.66 0.18 25)` dark mode only; light mode reuses the value above): a lighter reading of the same hue, used only where red itself is the text color (e.g. a form error message) rather than a fill. A single red can't be both a safe white-text fill *and* 4.5:1-safe as standalone text on near-black at once — those sit at opposite ends of the same luminance range — so the text variant exists specifically to satisfy the latter without touching the fill everywhere else uses.

### Secondary
- **Monitor Blue** (`oklch(0.72 0.09 230)` dark / `oklch(0.42 0.10 230)` light): A cool, quiet second signal — waveform-monitor blue. Used for links inside body copy and quiet informational tags (e.g. a category label on a media item), never for anything that competes with the red.

### Neutral — Dark (default)
- **Screening Black** (`oklch(0.09 0 0)`): Page background.
- **Booth Grey** (`oklch(0.15 0 0)`): Card/panel surface — one step off black, tonal layering only, no shadow.
- **Projector White** (`oklch(0.95 0 0)`): Body text and headlines.
- **Dim Grey** (`oklch(0.62 0 0)`): Secondary text, captions, metadata.
- **Booth Line** (`oklch(0.24 0 0)`): Hairline borders and dividers.

### Neutral — Light
- **Gallery White** (`oklch(1.000 0.000 0)`): Page background. Pure, no warm tint — the warmth lives in the accent, not the surface.
- **Print Grey** (`oklch(0.965 0 0)`): Card/panel surface.
- **Darkroom Ink** (`oklch(0.16 0 0)`): Body text and headlines.
- **Contact Sheet Grey** (`oklch(0.50 0 0)`): Secondary text, captions.
- **Print Line** (`oklch(0.87 0 0)`): Hairline borders and dividers.

### Named Rules
**The One Light Rule.** Tally-Light Red appears in at most one place per screen at rest (a CTA, an active tab). If a second red shows up, one of the two is wrong — pick the one that matters more.

**The No-Tint Rule.** Neutrals stay chroma-0 (true black/white/grey) in both themes. Warmth and mood come from the red and the serif display type, never from tinting the background toward cream, navy, or any other hue "for atmosphere."

## 3. Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)

**Character:** An editorial serif with real presence — the kind of type that opens a film's title card — paired with a sans that disappears into legibility. The serif does the talking; the sans does the work.

### Hierarchy
- **Display** (weight 340, `clamp(2.75rem, 6vw, 5.5rem)`, line-height 1.02, letter-spacing -0.02em): Page-level hero headlines only. One per page, maximum.
- **Headline** (weight 400, `clamp(1.75rem, 3vw, 2.75rem)`, line-height 1.1): Section titles (a portfolio category name, a services heading).
- **Title** (weight 600, 1.125rem, line-height 1.3): Card/component-level headings — a media item's caption title, a service's name.
- **Body** (weight 400, 1rem, line-height 1.6, max 70ch): Paragraph copy — bio text, service descriptions, form labels.
- **Label** (weight 500, 0.8125rem, letter-spacing 0.02em, sentence case — not uppercase): Metadata, timestamps, form field hints.

### Named Rules
**The Title-Card Rule.** Fraunces is reserved for Display and Headline roles only. It never appears in body copy, buttons, or UI chrome — those stay in Inter. Mixing the serif into small UI text kills the "one voice speaks, the rest listens" effect.

**The Sentence-Case Rule.** No uppercase tracked labels/eyebrows anywhere in the system (explicit anti-reference from PRODUCT.md). Labels use sentence case with light positive tracking (0.02em), not the ALL-CAPS eyebrow convention.

## 4. Elevation

Flat by default. Depth is conveyed through tonal layering — Booth Grey / Print Grey surfaces sit one step off the page background — not through drop shadows. A shadow is a rare, deliberate exception (a modal, a lightbox overlay), never a default card treatment.

### Shadow Vocabulary
- **Lightbox Overlay** (`box-shadow: 0 24px 64px rgba(0,0,0,0.45)`): The single case where a real shadow is warranted — a full-bleed image lightbox floating over the page. Not used on cards, buttons, or inline components.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow appears only when something is genuinely floating above the page (a lightbox, an open menu on mobile) — never as decoration on a static card.

## 5. Components

### Buttons
- **Shape:** Sharp-ish corners, 2px radius (`{rounded.sm}`) — a photo print's corner, not a rounded app-button.
- **Primary:** Tally-Light Red fill, Screening Black/Gallery White text (theme-matched background color as text, per the mid-luminance-saturated-fill rule), `14px 32px` padding. Reserved for the single most important action per page (contact CTA).
- **Ghost:** Transparent fill, Projector White/Darkroom Ink text, 1px Booth Line/Print Line border. Used for secondary actions (e.g. "View full gallery").
- **Hover / Focus:** Primary darkens to Tally-Light Red Deep on hover; both variants get a 2px `Monitor Blue` focus-visible ring, offset 2px, never removed for mouse users.

### Cards (MediaItemCard)
- **Corner Style:** 2px radius, matching buttons.
- **Background:** Booth Grey/Print Grey surface behind the image while it loads; the photograph itself is the card — no border, no shadow, no caption bar overlapping the image.
- **Caption:** Title-role text below the image, not overlaid on it — never obstruct the photograph.
- **Hover:** Subtle scale (1.02) on the image only, 400ms ease-out-quart; no shadow pop, no border appearing.

### Inputs / Fields (ContactForm)
- **Style:** Transparent background, 1px Booth Line/Print Line bottom border only (no boxed field) — matches the restrained, editorial feel.
- **Focus:** Border shifts to Monitor Blue, no glow/box-shadow.
- **Error:** Border shifts to Tally-Light Red, with inline label-role error text below — the one place outside the CTA where red is allowed, because it's signaling the same thing (attention required now).

### Navigation (Header)
- **Style:** Transparent over the hero, Screening Black/Gallery White at 90% opacity with backdrop-blur once scrolled past the hero. Label-role type, sentence case.
- **Active state:** Current page link gets a Tally-Light Red underline (2px, `{rounded.sm}` offset) — the only other place red appears besides the CTA.
- **Mobile:** Full-screen overlay menu (Screening Black/Gallery White, no transparency), Headline-role type for links, generous vertical spacing.

### Empty / Placeholder State (PlaceholderTile)
- Booth Grey/Print Grey surface, centered label-role text ("No photos yet"), no icon illustration — keeps the placeholder honest and unobtrusive rather than decorative.

## 6. Do's and Don'ts

### Do:
- **Do** let the photograph be the largest, highest-contrast element on every screen it appears on.
- **Do** reserve Tally-Light Red for exactly one purpose per screen (the CTA, or the active nav state) — never both loudly at once.
- **Do** use Fraunces only for Display and Headline roles; everything else is Inter.
- **Do** build both themes (dark default, light available) to the same standard — light mode is not an afterthought.
- **Do** support `prefers-reduced-motion` with an instant/crossfade fallback on every reveal.

### Don't:
- **Don't** add a stock-photo hero carousel, testimonial carousel, or "trusted by" logo row.
- **Don't** use SaaS hero-metric stat blocks or feature-grid cards with icon + heading + text repeated identically.
- **Don't** add a tiny uppercase tracked eyebrow above sections. Section headings speak for themselves in Headline-role Fraunces.
- **Don't** use gradient text or `background-clip: text` for emphasis — a single solid ink or accent color only.
- **Don't** use `border-left`/`border-right` as a colored accent stripe on cards or callouts.
- **Don't** use numbered 01/02/03 markers as decorative scaffolding — only if a section is a genuine, real sequence.
- **Don't** tint the neutral background toward cream, navy, or any hue "for warmth" — warmth lives in the red accent and the serif type, not the surface.
- **Don't** drop a shadow on a static card. Shadows are reserved for things actually floating above the page (lightbox, mobile menu).
