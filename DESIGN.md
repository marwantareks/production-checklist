# Design

How the page looks and why. This describes what `src/styles.css` and `src/template.html` do today. Change the CSS first, then update this file. Do not add a style here that the CSS does not have.

## Character

A calm, tool-like reference page with a light neo-brutalist touch: thick dark outlines, small hard offset shadows and rounded corners. Text is plain and dense enough for architects who scan. Color carries meaning (status, ownership, category) and is never the only signal.

## Hard constraints

- One self-contained HTML file. No external fonts, images, scripts or requests. Icons are inline SVG that use `currentColor`.
- Content Security Policy by hash (see `docs/ARCHITECTURE.md`). All style lives in the one `<style>` block. No `style=""` attributes and no inline event handlers in the template. Setting `element.style.x` from script is fine.
- Imported agent text is shown with `textContent`, never `innerHTML`.
- Light and dark themes, switched with `data-theme` on `<html>`. The default is light. A small inline script applies the saved choice (`prc.theme`) before first paint. The page does not follow the OS preference.
- Honor `prefers-reduced-motion`: smooth scrolling, the detail fade and the chevron turn only run when motion is allowed.
- Print: the sticky bar becomes static, and the filter chips and theme button are hidden.

## Color tokens

Defined on `:root`, overridden under `[data-theme="dark"]`. Use the token, never a raw hex.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F8FA` | `#0E151C` | Page background, inset panels |
| `--surface` | `#FFFFFF` | `#16202A` | Cards, panels, inputs |
| `--ink` | `#16212B` | `#E7EDF2` | Body text |
| `--ink2` | `#52606D` | `#9AA8B5` | Secondary text, captions |
| `--line` | `#D8DEE4` | `#273543` | Hairline borders |
| `--line2` | `#AEB8C2` | `#445566` | Control borders |
| `--accent` | `#0B6E78` | `#5CC8D2` | Focus rings, selected chips |
| `--accent-bg` | `#DDF1F2` | `#12343A` | Selected and highlighted fills |
| `--ol` | `#1B2733` | `#8FA3B5` | The thick outline on cards and buttons |
| `--sh` | `#1B2733` | `#05090D` | Hard offset shadow color |
| `--btn` / `--btn-ink` | `#0B6E78` / `#FFFFFF` | `#5CC8D2` / `#0B1A1D` | Primary button fill and text |

Meaning colors:

| Token | Light | Dark | Means |
|---|---|---|---|
| `--ok` | `#1E7A3E` | `#6FD08C` | Decided, found |
| `--defer` | `#4A5F8A` | `#9FB3D9` | Deferred, cannot determine |
| `--miss` | `#B3261E` | `#F2827C` | Missing, not found, errors |
| `--own` | `#0B6E78` | `#5CC8D2` | Ownership dot: Own |
| `--guard` | `#B26A00` | `#F0A93B` | Ownership dot: Guardrail, and a partial finding |
| `--del` | `#7B8794` | `#8896A4` | Ownership dot: Delegate |

Not applicable uses `--ink2` with a dashed outline, and "not reviewed" uses `--line2`.

### Category hues

Eight tinted pairs set `--pb` (background) and `--pf` (foreground) through a class: `h-blue`, `h-teal`, `h-red`, `h-purple`, `h-green`, `h-coral`, `h-pink`, `h-amber`. Each has a dark variant. Categories reference a hue by name in `content/categories.yaml`. Pills, tiles, the open detail panel's left border and the section tags all read `--pb` and `--pf`, so a new component only needs to use those two variables.

## Typography

System font stack only: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Code uses `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.

- Body: 16px, line height 1.6.
- Hero title: `clamp(2.1rem, 4.6vw, 3.1rem)`, weight 800, line height 1.08.
- Section titles: `clamp(1.6rem, 3.4vw, 2.2rem)`, weight 800.
- Category heading in the checklist: 1.3rem, weight 700.
- Card and detail titles: 1rem, weight 600 or 700.
- Captions and counts: 0.8rem to 0.92rem in `--ink2`.
- Letter spacing is slightly negative on headings (`-.015em`).
- Reading width: detail paragraphs are capped at `70ch`, the hero lead at `52ch`.

## Layout

- Container `.wrap`: max width 1080px, 20px side padding.
- Page sections `.sect`: 68px vertical padding. Alternate sections sit on a `.band` (surface color with hairline borders).
- Hero: two columns (`1.1fr 1fr`, 44px gap), one column at 820px and below.
- Category cards: `repeat(auto-fill, minmax(300px, 1fr))`, 18px gap.
- Feature cards: `repeat(auto-fit, minmax(190px, 1fr))`, 18px gap.
- Breakpoints: 820px (stack hero and footer, hide nav links and stickers) and 420px (hide the nav button).
- The toolbar `.bar` is sticky at the top of the checklist. Anchors account for its height.

## Shape, outline and shadow

- Cards, panels and buttons: 2px solid `--ol` outline.
- Radii: 14px for cards and panels, 10px for buttons, tiles and the mode switch, 8px for chips, inputs and small controls, full pill for badges and tags.
- Hard shadows with no blur: `3px 3px 0` on buttons and small cards, `4px 4px 0` on category cards and the agent panel, `5px 5px 0` on the hero card, `6px 6px 0` on the closing call to action. On hover, buttons and cards move `1px, 1px` and the shadow shrinks by 1px.
- Hairline `1px --line` borders are for quiet structure (dividers, detail panel, findings). The thick outline is for things you act on or that headline a section.

## Components

**Primary button `.btn`**: `--btn` fill, `--btn-ink` text, weight 600, 10px 18px padding, thick outline and hard shadow. `.btn.alt` swaps to the surface fill with `--ink` text. `.btn.sm` is smaller.

**Chip `.chip`**: filter control. 8px radius, `--line2` border, transparent fill. Pressed state (`aria-pressed="true"`) uses `--accent-bg` fill and `--accent` border and text.

**Pill `.pill`**: one concern. Tinted by its category hue, with an ownership dot at the left, and optional status and agent-finding icons at the right. A concern that fits two categories gets a dashed border (`.dual`). The open pill (`aria-expanded="true"`) gets a 2px `--ink` outline.

**Ownership dot `.dot`**: 9px circle. Own, Guardrail and Delegate use `--own`, `--guard` and `--del`. The legend under the toolbar explains them.

**Detail panel `.detail`**: surface fill, hairline border, a 4px left border in the category's `--pf`. It fades in over 160ms when motion is allowed. It holds the definition, how it works, review question, trade-off, related concerns, the status buttons and the "Go deeper" disclosure.

**Status buttons `.sb`**: four buttons (Decided, Deferred, Missing, Not applicable) each with an icon in its meaning color. The pressed button inverts to `--ink` fill with `--bg` text.

**Progress meter `.meter`**: stacked bar in `--ok`, `--defer` and `--miss` over a `--line` track. Always paired with a text count, so color is not the only signal.

**Disclosure `details.deep`**: the summary is styled like a card (thick outline, hard shadow) with a chevron box at the right that rotates when open.

**Mode switch `.modes`**: two joined buttons, Browse and Agent review. The active one uses `--btn` fill.

**Agent panel `.agent`**: surface card with numbered steps. Prompts and previews use `.pre` (monospace, scrolls after 300px). Inline code uses `code`.

**Finding `.finding`**: inset block on `--bg` with a result badge (`.fbadge`). Found is `--ok`, partial `--guard`, not found `--miss`, cannot determine `--defer`, not applicable `--ink2`.

**Tile `.tile`** and **sticker `.sticker`**: 42px and 46px rounded squares that hold an icon on the category hue. Stickers are decorative, slightly rotated, and hidden on small screens.

## Icons

Inline SVG, 24 by 24 viewBox, stroke 2 to 2.6, round caps and joins, `fill="none"`, `stroke="currentColor"`, `aria-hidden="true"`. Sizes: 14 to 15px inline with text, 20 to 22px in tiles and buttons. Category icons come from the SVG path data in `content/categories.yaml`.

## Accessibility

- Visible focus: 2px `--accent` outline with a 2px offset on buttons, inputs and links.
- Toggle controls use `aria-pressed` or `aria-expanded`, and the open pill sets `aria-controls`. Pills carry a full `aria-label` that includes status and finding.
- Status is always shown as an icon plus text, not color alone. Not applicable also uses a dashed outline.
- Keep body text at 4.5:1 contrast or better against its background in both themes, and check any new color pair in dark mode too.
- Sizes today: the search box is 38px tall and the theme toggle is 40px square. Chips and status buttons are smaller (about 32px tall), so do not shrink them further.

## Adding to the design

1. Reuse a token. If you need a new color, add it to both `:root` and `[data-theme="dark"]` together.
2. Use a category hue through `--pb` and `--pf` rather than new colors.
3. Match the outline, radius and shadow of the nearest existing component.
4. Check light, dark, a 390px wide screen and print.
5. Run `npm run check` and `npm run test:e2e`. The e2e test fails on horizontal overflow at phone width, and the page test fails on inline style attributes.
