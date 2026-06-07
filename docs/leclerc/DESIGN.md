---
version: alpha
name: LeClerc-design
description: "Cleo for spies. A near-black field-console canvas (#0a0e14, never pure black) with ONE atmospheric element — a soft, slow, low-contrast spy gradient (steel-teal drifting into faint ember) sitting behind everything, heavily blurred and dimmed (tenue). On top, a four-step surface ladder with hairline borders carries depth without shadow, Linear-style. The voice is split across two type families on purpose: an editorial soft serif (Fraunces) carries the greeting and the assistant's spoken answers — warm, human, a little literary, the Cleo register; Inter carries all UI and body; and JetBrains Mono is RESERVED for data — amounts, sats, ids, coordinates — rendered in ember as the system's 'intel' tell. Two scarce accents only: steel-blue (#5b8cff) for intel/cool/focus/primary, and ember-amber (#ffb95f) for money/warmth/data and the center voice button. Mobile-first (≤480px), voice-first conversational shell, dark-only. Reads as a calm handler in your pocket: covert, premium, hushed."

colors:
  primary: "#5b8cff"
  on-primary: "#00102e"
  primary-hover: "#7da6ff"
  primary-focus: "#3f6fe0"
  ember: "#ffb95f"
  on-ember: "#2a1700"
  ember-soft: "#4a3210"
  secondary: "#4edea3"
  on-secondary: "#00251a"
  ink: "#e6ebf5"
  ink-muted: "#aab4c6"
  ink-subtle: "#6f7b8f"
  ink-tertiary: "#4a5568"
  canvas: "#0a0e14"
  surface-1: "#11161f"
  surface-2: "#151b26"
  surface-3: "#1c2330"
  surface-4: "#232b3a"
  hairline: "#2b3342"
  hairline-strong: "#3a4456"
  threat-critical: "#ff5449"
  threat-elevated: "#ffb95f"
  threat-routine: "#4edea3"
  semantic-overlay: "#000000"

typography:
  display-xl:
    fontFamily: Fraunces
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -1.4px
  display-lg:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -1.0px
  display-md:
    fontFamily: Fraunces
    fontSize: 26px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.6px
  answer:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.30
    letterSpacing: -0.2px
  headline:
    fontFamily: Fraunces
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.3px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.1px
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.05px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  label:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: 0
  data:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: 0
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: 0

rounded:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 28px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 72px

components:
  greeting:
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
  chat-bubble-user:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 10px 16px
  chat-bubble-assistant:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.answer}"
    rounded: "0"
    padding: 0
  input-pill:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 10px 16px
  voice-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 0
  voice-button-listening:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.on-ember}"
    rounded: "{rounded.full}"
  action-bar:
    backgroundColor: "transparent"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.caption}"
  chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 6px 12px
  data-token:
    backgroundColor: "transparent"
    textColor: "{colors.ember}"
    typography: "{typography.data}"
  threat-badge-critical:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.threat-critical}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 10px
  threat-badge-elevated:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.threat-elevated}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 10px
  threat-badge-routine:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.threat-routine}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 10px
  record-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 16px
  brief-card:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 20px
  stat-tile:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.md}"
    padding: 12px 14px
  confirm-sheet:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: 20px
  top-bar:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: 52px
  app-background:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
---

## Overview

LeClerc is **Cleo for spies**: a voice-first, local-first assistant that runs the
operative's finances and field intelligence entirely on-device. The canvas is
`{colors.canvas}` (#0a0e14) — near-black with a faint blue-graphite tint, never
pure black. Above it sits a four-step surface ladder (`{colors.surface-1}` →
`{colors.surface-4}`) with hairline borders (`{colors.hairline}` →
`{colors.hairline-strong}`) carrying depth without drop shadow, the way Linear
does it.

The one departure from a flat dark system is **a single atmospheric element**:
the `app-background` — a slow WebGL gradient (steel-teal drifting into faint
ember) that lives behind everything, heavily blurred and dimmed to ~0.45 with a
dark veil. It must read *tenue* (soft, hushed), never decorative or busy. It is
the only gradient in the system.

The type voice is deliberately split. **Fraunces**, a soft editorial serif,
carries the greeting and the assistant's spoken answers — the warm, human,
slightly literary Cleo register. **Inter** carries all UI chrome and body.
**JetBrains Mono** is reserved for data — amounts, sats, ids, coordinates —
rendered in `{colors.ember}` as the system's "intel" tell. When money or secrets
appear, they appear in code.

Two scarce chromatic accents, never decorative: **steel-blue** `{colors.primary}`
(#5b8cff) for intel, focus, and primary actions; **ember-amber** `{colors.ember}`
(#ffb95f) for money, warmth, data tokens, and the center voice button. Threat
colors (`{colors.threat-critical}` / `-elevated` / `-routine`) are semantic only.

**Key Characteristics:**
- **Dark-only, mobile-first** (≤480px), voice-first conversational shell.
- **One soft spy gradient** behind everything; otherwise flat surfaces + hairlines.
- **Serif for voice, Inter for UI, mono for data** — three jobs, never mixed up.
- **Two scarce accents**: steel-blue (intel) + ember (money). No third hue.
- Surface ladder carries hierarchy; no drop shadows.
- Generous rounding (Cleo-soft): pills and 16–28px corners, not Linear's 8/12px.
- Calm motion: slow, GPU-only, sub-300ms; the voice waveform is the liveliest thing.

## Colors

### Brand & Accent
- **Steel-Blue** ({colors.primary}): primary actions, focus rings, intel/cool emphasis, the idle voice button.
- **Steel Hover / Focus** ({colors.primary-hover} / {colors.primary-focus}): hovered + focused states.
- **Ember** ({colors.ember}): money, warmth, all data tokens (mono), the listening voice button. The "intel" accent.
- **Ember Soft** ({colors.ember-soft}): low-emphasis ember fills (containers).
- **Teal** ({colors.secondary}): confirmations, secure/private indicators (e.g. off-chain Lightning).

### Surface
- **Canvas** ({colors.canvas}): page background — #0a0e14, near-black blue-graphite.
- **Surface 1** ({colors.surface-1}): record cards, low panels.
- **Surface 2** ({colors.surface-2}): input pill, chips, brief cards, stat tiles.
- **Surface 3** ({colors.surface-3}): user chat bubbles, sheets, raised controls.
- **Surface 4** ({colors.surface-4}): deepest lift (rare).
- **Hairline / Strong** ({colors.hairline} / {colors.hairline-strong}): 1px borders, focus.

### Text
- **Ink** ({colors.ink}): headlines, answers, emphasized body — #e6ebf5.
- **Ink Muted** ({colors.ink-muted}): secondary type — #aab4c6.
- **Ink Subtle** ({colors.ink-subtle}): tertiary, inactive nav, placeholders — #6f7b8f.
- **Ink Tertiary** ({colors.ink-tertiary}): disabled, footnotes — #4a5568.

### Semantic (reserved, never decorative)
- **Threat Critical / Elevated / Routine** — triage badges only.
- **Overlay** ({colors.semantic-overlay}): scrim for sheets/modals.

## Typography

### Font Family
- **Fraunces** (serif) — greeting, display, and the assistant's answers. Fallback `ui-serif, Georgia, "Times New Roman", serif`. The Cleo editorial voice.
- **Inter** (sans) — all UI, labels, body. Fallback `ui-sans-serif, system-ui, sans-serif`.
- **JetBrains Mono** — data only: amounts, sats, ids, coordinates. Fallback `ui-monospace, "SF Mono", Menlo`.

### Hierarchy

| Token | Family | Size | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | Fraunces | 40px | 600 | -1.4px | Home greeting ("Hola, operativo.") |
| `{typography.display-lg}` | Fraunces | 32px | 600 | -1.0px | Screen titles |
| `{typography.display-md}` | Fraunces | 26px | 600 | -0.6px | Section headings |
| `{typography.answer}` | Fraunces | 22px | 500 | -0.2px | Assistant spoken answers (chat) |
| `{typography.headline}` | Fraunces | 20px | 600 | -0.3px | Card titles |
| `{typography.body-lg}` | Inter | 18px | 400 | -0.1px | Lead body |
| `{typography.body}` | Inter | 16px | 400 | -0.05px | Default body, user bubbles |
| `{typography.body-sm}` | Inter | 14px | 400 | 0 | Dense body |
| `{typography.label}` | Inter | 14px | 600 | +0.01em | Buttons, chips, nav |
| `{typography.caption}` | Inter | 12px | 500 | 0 | Captions, badges, meta |
| `{typography.data}` | JetBrains Mono | 15px | 500 | 0 | Amounts / sats / ids inline |
| `{typography.data-sm}` | JetBrains Mono | 12px | 400 | 0 | Dense data (ids, coords) |

### Principles
- **Serif = voice, Inter = chrome, mono = data.** Never use serif for UI or mono for prose.
- **Negative tracking on serif display** (-1.4px at 40px); body holds near 0.
- **Data is always ember mono.** A dollar figure, sats, a record id, or a coordinate renders in `{typography.data}` colored `{colors.ember}`. This is the signature.
- **Answers feel spoken.** Short, 1–2 sentences, serif, no markdown — they could be read aloud verbatim.

## Layout

### Spacing System
- Base unit 4px. Tokens: `{spacing.xxs}` 4 · `{spacing.xs}` 8 · `{spacing.sm}` 12 · `{spacing.md}` 16 · `{spacing.lg}` 24 · `{spacing.xl}` 32 · `{spacing.xxl}` 48 · `{spacing.section}` 72.
- Card padding: `{spacing.md}`–`{spacing.lg}`. Sheets/confirm: `{spacing.lg}`.

### Container
- Mobile-first. Single column, `max-width: 480px`, centered. The phone is the target; desktop is the same column on the dark canvas.
- The conversation scrolls; the greeting sits at top, the input pill + action bar pin to the bottom (safe-area aware).

### Whitespace Philosophy
The dark canvas (with its faint drifting gradient) IS the whitespace. Generous
negative space around the greeting and answers; content rises from the bottom as
the operative talks. Calm, never dense.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | flat on canvas | greeting, assistant answers, body |
| 1 | `{colors.surface-1}` + 1px `{colors.hairline}` | record cards |
| 2 | `{colors.surface-2}` | input pill, chips, brief/stat tiles |
| 3 | `{colors.surface-3}` | user bubbles, confirm sheets |
| focus | 2px `{colors.primary}` ring @ ~50% | focused input/button |

Depth = surface ladder + hairlines + the soft background bloom. No drop shadows.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 8px | small chips, badges |
| `{rounded.sm}` | 12px | inline tags |
| `{rounded.md}` | 16px | cards, inputs, stat tiles |
| `{rounded.lg}` | 20px | bubbles, brief cards |
| `{rounded.xl}` | 28px | confirm sheets, oversized panels |
| `{rounded.pill}` / `{rounded.full}` | 9999px | input pill, chips, voice button, badges |

Softer than Linear by design — Cleo's calm comes from rounded, pill-forward shapes.

## Motion
- GPU-only (transform/opacity), strong ease-out, sub-300ms; never scale-from-zero.
- The `app-background` gradient drifts slowly (~1/260 time scale) and is the only ambient motion.
- The `voice-button` is the liveliest element: pulsing ring while listening, equalizer bars while speaking.
- Content enters with `anim-enter` (10px rise + fade); fixed bars use `anim-fade`.
- Honor `prefers-reduced-motion`: static gradient fallback, fades only.

## Components

### Conversation
- **`greeting`** — Fraunces `{typography.display-xl}`, ink. One line, time/context aware.
- **`chat-bubble-user`** — right-aligned, `{colors.surface-3}`, `{rounded.lg}` (br corner tightened), `{typography.body}`, max-width 85%.
- **`chat-bubble-assistant`** — left, no chrome, `{typography.answer}` serif; data inside renders as `data-token`. Pending state = three breathing dots.
- **`chip`** — pill, `{colors.surface-2}`, `{typography.label}`, optional leading Material icon. Used for starter suggestions and live RAG hits.
- **`data-token`** — inline mono in `{colors.ember}` for amounts/sats/ids/coords.

### Input & voice
- **`input-pill`** — `{colors.surface-2}` @ 80% + backdrop blur, `{rounded.pill}`, with a trailing audio toggle (graphic_eq / volume_off).
- **`voice-button`** — round, `{colors.primary}` idle; `voice-button-listening` shifts to `{colors.ember}` with a pulsing ring; speaking shows equalizer bars; thinking shows breathing dots.
- **`action-bar`** — transparent, safe-area bottom. Four items: **Spend** (trending_down) · **Ask** (center, the raised `voice-button`) · **Stash** (savings) · **Request** (request_quote). Labels via i18n.

### Intel & finance
- **`record-card`** — `{colors.surface-1}`, `{rounded.md}`; threat badge + summary + meta.
- **`threat-badge-*`** — pill on `{colors.surface-2}`, colored by triage.
- **`brief-card`** — `{colors.surface-2}`, `{rounded.lg}`; BLUF + findings with cited ids (mono).
- **`stat-tile`** — `{colors.surface-2}`, value in `{typography.data}` ember (balances, spend).
- **`confirm-sheet`** — bottom sheet `{colors.surface-3}`, `{rounded.xl}`; required before any pay / dead-drop / wipe.

### Chrome
- **`top-bar`** — transparent, 52px: shield + wordmark left, mode badge + settings right.
- **`app-background`** — fixed, `-z-10`, the blurred spy gradient + dark veil. variant `spy`.

## Do's and Don'ts

### Do
- Keep `{colors.canvas}` as the anchor; let the gradient stay faint and slow.
- Render every amount, sats value, id, and coordinate as ember mono (`data-token`).
- Use Fraunces only for the greeting and assistant answers; Inter for everything else.
- Reserve steel-blue for intel/primary/focus and ember for money/data/voice. Two accents, period.
- Carry depth with the surface ladder + hairlines.
- Gate pay / dead-drop / wipe behind a `confirm-sheet`.
- Keep answers short and spoken-shaped.

### Don't
- Don't ship a light theme. Don't use pure `#000000` as canvas.
- Don't add a second atmospheric gradient or a third accent hue.
- Don't set UI in serif or prose in mono.
- Don't use drop shadows for depth.
- Don't let the background gradient get bright, fast, or busy — it must stay tenue.
- Don't auto-execute side-effecting actions; the model proposes, the sheet confirms.

## Responsive Behavior

Mobile-first; the single 480px column is the canonical layout.

| Name | Width | Changes |
|---|---|---|
| Mobile | ≤480px | Canonical. Bottom-pinned input + action bar, safe-area aware. |
| Tablet/Desktop | >480px | Same centered 480px column on canvas; gradient fills the full viewport behind it. |

- Touch targets ≥44px (voice button larger). Input ≥44px tall.
- Conversation area is the only scroll region; greeting + bars stay fixed.

## Voice & Personality (the spy-Cleo register)
- Witty, direct, a little savage but caring (Cleo). Spanish-first; en parity.
- 1–2 sentences. Never markdown/lists/code when spoken. Ends reasoning silently (`/no_think`).
- Roasts the spend, then makes the plan. Treats secrets and money with dry calm.
- On-device pride: it never sends data anywhere the operative doesn't control.

## Iteration Guide
1. Work ONE component at a time; reference it by its `components:` token name.
2. Decide the surface level (0–3) before styling a new section.
3. Default prose to `{typography.body}` (Inter 400); answers to `{typography.answer}` (Fraunces).
4. Any data value → `data-token` (ember mono). No exceptions.
5. Keep accents scarce; add semantic threat colors only for triage.
6. Validate against the live tokens in `apps/app/src/app/globals.css`.

## Known Gaps / Implementation Notes
- These tokens mirror `apps/app/src/app/globals.css` (the running theme) — keep them in sync; globals is the runtime source of truth.
- Fraunces / Inter / JetBrains Mono load via the Google Fonts link in `apps/app/src/app/layout.tsx`.
- The `app-background` spy gradient lives in `components/animated-background` + `components/app-background.tsx`.
- Mono-for-data auto-formatting is implemented in `components/chat-bubble.tsx` (`DATA_RE`).
