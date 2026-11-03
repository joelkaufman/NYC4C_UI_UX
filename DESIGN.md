---
name: Provider Portal
description: Onboarding portal for medical professionals. A light, quiet, Apple-style form system where the next action is always the clearest thing on screen.
colors:
  forest: "#03682F"
  forest-hover: "#005223"
  forest-subtle: "#E9F5E5"
  leaf: "#6CC13E"
  label: "#18181B"
  secondary-label: "#6B6B70"
  grouped-ground: "#F2F2F7"
  surface: "#FFFFFF"
  field-fill: "#F1F1F3"
  field-hover: "#E9E9EC"
  muted-ground: "#F1F1F4"
  separator: "#E1E1E5"
  grey-700: "#404040"
  grey-600: "#525252"
  grey-500: "#737373"
  grey-400: "#A3A3A3"
  grey-300: "#D4D4D4"
  grey-200: "#E5E5E5"
  success: "#0D7359"
  success-ground: "#E9F7F2"
  danger: "#BB1B1B"
  danger-ground: "#FEF1F1"
  warning: "#AF510E"
  warning-ground: "#FEF3E7"
  info: "#404C96"
  info-ground: "#F0F1FA"
  neutral-status: "#646468"
  neutral-ground: "#EEEEF1"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist Variable, system-ui, Segoe UI, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist Variable, system-ui, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.02em"
  module-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist Variable, system-ui, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist Variable, system-ui, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "-0.01em"
  input:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist Variable, system-ui, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "-0.003em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist Variable, system-ui, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "-0.003em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist Variable, system-ui, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "20px"
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist Variable, system-ui, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
  badge:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Geist Variable, system-ui, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  sm: "8px"
  md: "10px"
  tile: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.forest-hover}"
  button-filled:
    backgroundColor: "{colors.field-fill}"
    textColor: "{colors.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-filled-hover:
    backgroundColor: "{colors.field-hover}"
  button-ghost:
    textColor: "{colors.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.muted-ground}"
  input:
    backgroundColor: "{colors.field-fill}"
    textColor: "{colors.label}"
    typography: "{typography.input}"
    rounded: "{rounded.md}"
    padding: "4px 14px"
    height: "44px"
  input-hover:
    backgroundColor: "{colors.field-hover}"
  input-focus:
    backgroundColor: "{colors.surface}"
  input-invalid:
    backgroundColor: "{colors.danger-ground}"
  segmented-track:
    backgroundColor: "{colors.field-fill}"
    rounded: "{rounded.md}"
    padding: "4px"
  segmented-option:
    textColor: "{colors.grey-600}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "36px"
  segmented-option-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.label}"
  status-badge:
    typography: "{typography.badge}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "24px"
  saved-pill:
    backgroundColor: "{colors.success-ground}"
    textColor: "{colors.success}"
    typography: "{typography.badge}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  top-bar:
    textColor: "{colors.label}"
    height: "56px"
  step-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  item-tile:
    backgroundColor: "{colors.field-fill}"
    rounded: "{rounded.tile}"
    padding: "12px 16px"
  item-tile-rejected:
    backgroundColor: "{colors.danger-ground}"
  rail-row-selected:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.tile}"
  request-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  step-tab:
    textColor: "{colors.grey-700}"
    height: "48px"
    padding: "0 12px"
  step-tab-current:
    textColor: "{colors.label}"
  footer:
    backgroundColor: "{colors.surface}"
    height: "64px"
---

# Design System: Provider Portal

## Overview

**Creative North Star: "The Quiet Form"**

A light, grouped interface in the manner of Apple's own settings and forms. Nothing is dark: a translucent white header floats over a grouped grey page (#F2F2F7), and the work sits on soft white panels with generous 16px corners and a faint shadow instead of a border. Inside, fields are filled rather than outlined, sections are separated by hairlines rather than boxed, and items such as uploads, signatures and summaries sit on soft grey tiles. The system font (SF Pro on Apple devices, Geist as a fallback) carries the whole hierarchy in near-black.

There is one accent, the forest green from the logo, and it means "act here" or "you are here": primary buttons, links, the focused field's edge and halo, the current step, the current tab underline, progress. Approval is a bluer emerald, kept apart from the forest accent. Problems are red and burnt orange, and "in review" is a soft indigo. There are no per-module colours; modules are told apart by icon and name. Status is always icon + label + colour.

Density stays comfortable: 15px input text in 44px fields, 13px medium labels, 32px between sections, and one sticky footer that always holds the next action at bottom right. Motion is short and state-led: steps rise into place, checks pop, notes fade in, and all of it stops under reduced motion.

**Key Characteristics:**
- No dark surfaces: a translucent white header with a hairline, a grouped grey page, white panels.
- Soft panels: 16px corners and a faint two-layer shadow, no border.
- Filled inputs: tertiary grey fill at rest, white with a green edge and 4px green halo on focus, a red tint when invalid.
- Hairline-divided sections, never boxed; items sit on soft 12px grey tiles.
- One green accent; emerald for approval; red and orange for problems; soft indigo for review.
- System font in near-black, with labels at 13px medium.
- Red is earned: it appears only for issues the provider has already walked past, or for HR rejections.

## Colors

Neutral greys from Apple's grouped palette, one green accent, and a separate status set.

### Primary
- **Clinical Green** (#0E768B): primary buttons, links, the "‹ My requests" link, the focused field's edge and 4px halo (14% green), the current module and current step circles, the product mark, the caret, focus rings, module glyphs. Hover deepens to **Green Hover** (#0A6375). **Green Subtle** (#E7F6F9) is text selection, the "in progress" badge ground and the upload drag-over tint.
- **Progress Green** (#1F96AD): progress fills and the 3px underline of the current step tab. A fill, never text (3.5:1 on white). The CSS variable keeps the name `--lime` for compatibility.

### Neutral
- **Label** (#18181B): body text, field labels, titles, selected segment text.
- **Secondary Label** (#6B6B70): descriptions, help text, meta lines, placeholders, "Module N of 5" (AA on white, on the page and on the field fill).
- **Grouped Ground** (#F2F2F7): the page.
- **Surface** (#FFFFFF): the step panel, request cards, the selected rail row, the focused field, the selected segment.
- **Field Fill** (#F1F1F3): resting inputs, the segmented track, filled buttons, upload / e-sign / summary tiles. **Field Hover** (#E9E9EC) on hover.
- **Muted Ground** (#F1F1F4): ghost button hover.
- **Separator** (#E1E1E5): hairlines between sections, under the panel header and tabs, above the footer.
- **Greys** (Tailwind neutral): Grey 700 (#404040) for inactive tab labels and banner body copy; Grey 600 (#525252) for unselected segment text and locked module names; Grey 500 (#737373) for untouched step numerals and the lock glyph; Grey 400 (#A3A3A3) for tab chevrons; Grey 300 (#D4D4D4) for untouched circle rings, rail connectors and dashed upload zones; Grey 200 (#E5E5E5) for empty progress tracks and the avatar.

### Status
- **Success** (#0D7359 on #E9F7F2): an emerald for approved, accepted, signed, completed steps, approved module circles and the Saved pill.
- **Danger** (#BB1B1B on #FEF1F1): issues, rejections, required asterisks, field errors, invalid field tint.
- **Warning** (#AF510E on #FEF3E7): change requested, address-history warnings.
- **Info** (#404C96 on #F0F1FA): a soft indigo for in review and uploaded-awaiting-review.
- **Neutral** (#646468 on #EEEEF1): not uploaded, preparing, not started.

### Named Rules
**The Earned Red Rule.** Red marks a step only after the provider opened it and moved on with required fields empty, or when HR rejected the module or an item. Untouched required work is neutral ("N to complete", grey circle), never red.

**The Pending Is Work Rule.** A document waiting for signature is neutral work ("Ready to sign" in green), not a problem. It turns red only when the document is rejected or voided.

**The One Accent Rule.** Green is the only accent and means act here or you are here. There is no per-module colour; a module is identified by its icon and name. Green, red, orange and indigo are status-only.

**The Approved Is Green Rule.** Approval uses the emerald, never the forest accent, so "done" never reads as "current".

**The No Dark Surfaces Rule.** No dark bands, dark headers or coloured rules across the page. Depth and grouping come from the grey ground, white panels and hairlines.

## Typography

**Body Font:** the system stack: -apple-system, BlinkMacSystemFont, SF Pro Text, then Geist Variable, system-ui, Segoe UI, sans-serif.

**Character:** Apple's own UI type where available, with a very slight negative tracking on body text (-0.003em). Hierarchy comes from size and weight in near-black; colour is reserved for the accent and status.

### Hierarchy
- **Display** (600, 28px, line-height 1, -0.02em, tabular): the overall progress percentage in the rail. Only figures.
- **Headline** (600, 24px/32px, -0.02em): the step title. The rail's request title uses 22px at the same weight and tracking.
- **Module title** (600, 20px/28px, -0.02em): the module name in the panel header.
- **Title** (600, 17px, -0.01em): section titles.
- **Lead** (400, 15px): step descriptions (max 68ch), the product name, the "‹ My requests" link.
- **Input** (400, 15px): text inside fields.
- **Body** (400, 14px/20px, -0.003em): values, banner text, buttons (600), rail module names (600).
- **Label** (500, 13px, Label colour): every field label, sitting 6px above its field.
- **Meta** (400, 13px/20px): help text, field errors, section descriptions, dates, "Module N of 5".
- **Badge** (500, 12px/16px): status badges, issue counts, step-circle numerals, the Saved pill (600).

### Named Rules
**The 12px Floor Rule.** No text renders below 12px. The `2xs` step (12/16) is the smallest size in the scale.

**The Counted Figures Rule.** Dates, sizes, counts and percentages use tabular numerals.

**The Quiet Label Rule.** Labels are near-black 13px medium, not coloured and not uppercase.

## Layout

Three regions from 1024px up: a sticky 56px translucent header spanning the viewport, then the rail and the step panel. The header's contents and the process page sit in one centred container capped at 1480px, with 32px side gutters (48px from 1280px). The rail's content column is 260px (280px from 1280px) with a 12px left bleed for the selected row and focus rings, no border and no background of its own, and 32px top and bottom padding. A 32px gap (40px from 1280px) separates it from the step panel, which sits with 32px above and below.

Inside the panel, top to bottom: the module header (bare 24px green glyph, "Module N of 5" over the module name) with a hairline below; the sub-step tabs with a hairline below; the module banner if any; the step title and description; the step content; the sticky 64px footer. Step content is centred at an 880px measure inside the panel (minimum 32px side padding), while hairlines still run the full panel width. On phones and small tablets, content pads 16px (24px from 640px).

Sections are separated, not boxed: each section after the first gets a hairline above it and 32px of top padding, and sections stack 32px apart. Fields inside space 16px apart; short pairs sit in two columns from 640px.

Below 1024px the rail disappears. A translucent white module bar (white at 85%, blurred, hairline below) sticks under the header with the current module and a "Step N of M · title" control that opens the step list; the module list opens as a sheet. Grids collapse to one column; the footer stays sticky. Scroll padding (96px top desktop, 168px phone, 88px bottom) keeps focused fields clear of the sticky rows.

### Named Rules
**The Bottom-Right Rule.** The primary action always sits at the bottom right of the step panel in the sticky footer. Back sits at the left; the attention jump sits in the centre.

**The Tabs Name It Rule.** When sub-step tabs are showing on desktop, the step title is visually hidden (kept for screen readers and phones) because the current tab already names the step.

**The Summary Only Rule.** A completed (read-only) module shows only its last step, a summary titled "What you submitted". Earlier step links redirect there, and no tabs show.

**The Hairline Not Box Rule.** Sections inside a step are divided by a hairline and 32px of space, never wrapped in bordered cards.

## Elevation & Depth

Soft and light. Depth comes from white surfaces lifted off the grouped grey ground by a faint, wide shadow, and from translucency in the sticky bars. Inside the panel everything is flat: fills and hairlines do the grouping.

### Shadow Vocabulary
- **Panel** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.05)`): the step panel and request cards.
- **Selected row** (`box-shadow: 0 1px 2px rgba(0,0,0,0.05)`): the white selected row in the rail.
- **Raised segment** (`box-shadow: 0 1px 2px rgba(16,40,48,0.10), 0 1px 4px rgba(16,40,48,0.06)`): the selected segment in a segmented control.
- **Editing item** (`box-shadow: 0 2px 10px rgba(16,40,48,0.08)`): a repeatable-list item open for editing.
- **Menu** (`box-shadow: 0 8px 24px rgba(16,40,48,0.12)`): select menus. Dialogs, sheets, tooltips and toasts use `0 1px 2px 0 rgb(0 0 0 / 0.05)`.
- **Footer lift** (`box-shadow: 0 -1px 3px 0 rgb(15 23 42 / 0.06)`): the sticky step footer.
- **Field focus halo** (`box-shadow: 0 0 0 4px` green at 14%): the focused field; danger at 14% when invalid.
- **Approved halo** (`box-shadow: 0 0 0 3px #E9F7EC`): a ring around an approved module's rail circle.

### Named Rules
**The Translucent Chrome Rule.** Sticky bars (the header, the phone module bar) are white at 80 to 85% with a strong backdrop blur and a 6% black hairline, never a solid colour.

## Shapes

Rounded and soft. Fields, buttons and segmented tracks take 10px; item tiles, rail rows and the summary lists take 12px; the step panel, request cards and banners take 16px. Pills are reserved for status badges, issue counts and the Saved pill; circles for step and rail numerals and the avatar. The only line with weight is the 3px Progress Green underline on the current tab. Empty upload zones use a 1.5px dashed Grey 300 border on white. Icons stand bare, without tiles.

## Components

### Buttons
Soft, filled, 10px corners.
- **Shape:** 10px corners; 40px tall (32px small with 12px padding and 13px text).
- **Primary:** Clinical Green fill, white 14px semibold text, 16px horizontal padding, hover to Green Hover. Loading shows a spinner and disables.
- **Filled (outline variant):** Field Fill with Label text and no border, Field Hover on hover. Used for "Choose file", "Request new document", and "View" on completed requests.
- **Ghost:** no fill, Label text, Muted Ground on hover. Back, View, Replace, Remove.
- **Focus:** a 2px green ring offset 2px from the ground on every interactive element.
- **Disabled:** 50% opacity, with a title explaining why (e.g. "Resolve the items that need attention first").

### Chips and status badges
- **Style:** 24px pill, 1px border at 20% of the tone, tone ground, tone text, 14px icon + 12px medium label. Tones: neutral, primary (green on Green Subtle), danger, info, success, warning.
- **Saved pill:** Success ground with Success 12px semibold "Saved", beside a Secondary Label "Last saved" timestamp in the header.

### Cards / Containers
- **Step panel:** white, no border, 16px corners, panel shadow.
- **Panel header:** a bare 24px module glyph in green, "Module N of 5" (13px Secondary Label, tabular) over the module name (20px semibold), with a hairline below.
- **Section:** no box. A 17px semibold title, an optional 13px description and, when its fields show issues, a danger pill ("N items need attention"). Sections after the first carry a hairline and 32px top padding.
- **Item tiles:** uploads, e-sign items, uploading rows and the "What you submitted" summary lists sit on Field Fill with 12px corners and 12px/16px padding. Rejected items turn to a 60% danger tint with a 1px inset danger ring at 30%, and a danger strip carries the reason.
- **Request card:** white, 16px corners, panel shadow, no border and no status stripe. Title, "Started" date, status badge, a bare current-module glyph beside "Current: Module · status", a Progress Green bar for modules approved, module chips in status tones, and the action button.

### Inputs / Fields
- **Style:** 44px tall, Field Fill, transparent 1px border, 10px corners, 14px horizontal padding, 15px Label text; Field Hover on hover.
- **Label:** Label colour, 13px medium, 6px above the field, red asterisk for required (plus screen-reader "(required)"); optional "How to" helper aligned right.
- **Focus:** the fill turns white, the border turns green, and a 4px green halo at 14% appears. Open selects keep the same treatment.
- **Error:** a danger-ground fill with a danger border at 55%; on focus, white with a danger border and a danger halo. The message below is 13px danger with an alert icon and fades in.
- **Segmented control:** Yes/No questions use a Field Fill track (10px corners, 4px padding) holding 36px segments in Grey 600, 14px medium. The selected segment is a raised white segment with semibold Label text and the raised-segment shadow. An invalid control gets a 1px inset danger ring.
- **Read-only:** 13px Secondary Label over 14px Label value; "Not provided" in Secondary Label when empty.

### Navigation
- **Header:** 56px, white at 80% with a strong backdrop blur and a 6% black hairline. Left: a 32px green product mark with white initials, the product name (15px semibold) over a Secondary Label subtitle. Right: the Saved pill and timestamp, provider name, a Grey 200 initials avatar, and a ghost dev-panel icon button.
- **Module rail:** a green "‹ My requests" text link (15px), the request title (22px semibold), the "Started" date, then a progress block: "Progress" left, a 28px percentage right, an 8px Progress Green bar on a Grey 200 track, and a one-line "N items left in Module" note. Below, the vertical stepper: 28px numbered circles joined by a 2px connector (Success below approved modules, Grey 300 otherwise), a bare green module glyph, the module name, and a right-aligned count in the status tone. Circles: green for open or viewed; Success fill with a white check and a success-ground halo for approved; danger ring with "!" when flagged; Grey 300 ring on white when locked, with the name in Grey 600 and a Grey 500 lock. The viewed row is a white 12px-cornered row with the selected-row shadow.
- **Step tabs:** 48px tabs of a 24px circle + label, separated by Grey 400 chevrons. The current tab has a 3px Progress Green underline and a semibold Label label; hover shows a Grey 200 underline. Circles: green for current, Success ring with a Success check for complete, Grey 300 ring for untouched, danger ring with "!" for issues (label also turns danger). Arrow keys, Home and End move between tabs.

### Module banner
One banner at a time above the step title: tone ground, 1px tone border at 20%, 16px corners, 16px/12px padding, icon, semibold title, Grey 700 body. Rejected (danger, link to review and resubmit), in review (info), approved (success), change requested (warning, the provider's reason), and approved-with-declined-request (success with the admin's note). **"Request changes" lives only in the approved banner**; nothing else offers it. Open modules show no banner.

### Upload slot
Label row (13px medium, red asterisk or Secondary Label "Optional"). Empty: a white zone with a 1.5px dashed Grey 300 border and 12px corners, upload glyph, description, accepted types and size, and a filled "Choose file" button; drag-over tints Green Subtle and turns the border green. Filled: a Field Fill tile with a bare green file glyph, file name, size and date, status badge, then ghost View / Replace / Remove. Rejected: the danger tile treatment, a danger file glyph, a primary Replace, and a danger strip with "Rejected by HR:" and the reason.

### E-sign item
A Field Fill tile (12px corners) with a bare 20px green signature glyph, document title, status badge and one action: "Sign now" (primary) while waiting, "Request new document" (filled) when rejected, a Success "Signed" mark with a "View signed copy" link when done.

### Step footer
Sticky, white, hairline top, footer lift shadow, 16px bottom corners, 64px, content at the 880px measure. Back (ghost) left; the attention jump centre, which reads "N need attention" in danger when issues are showing and "N to complete" in neutral otherwise, and cycles focus through the issues; the primary action right.

## Do's and Don'ts

### Do:
- **Do** keep every surface light: grouped grey ground, white panels, translucent white chrome.
- **Do** use filled fields with the green focus edge and halo; never outline fields at rest.
- **Do** divide sections with hairlines and space; put items on soft 12px Field Fill tiles.
- **Do** pair every status with an icon and a text label as well as its colour.
- **Do** keep red for issues the provider has walked past and for HR rejections only (The Earned Red Rule).
- **Do** show a completed module as its single "What you submitted" summary step.
- **Do** keep the primary action at bottom right in the sticky footer.
- **Do** use tabular numerals for every date, size, count and percentage.

### Don't:
- **Don't** set any text below 12px.
- **Don't** add dark bands, dark headers or coloured rules across the page.
- **Don't** box sections in bordered cards inside the step panel.
- **Don't** colour a pending signature or untouched required work red; it is neutral work.
- **Don't** give modules their own colours or put icons on tinted tiles.
- **Don't** use the forest accent to mean approved; approval is the emerald.
- **Don't** set text in Progress Green; use Clinical Green for green text.
- **Don't** offer "Request changes" anywhere but the approved banner.
- **Don't** copy the reference portal's logo, name or wording.
