# Blockquote — design reference

Status: approved visual design (2026-11-15). Open `/?item=blockquote`. This is a reusable design reference, not a package export or final TypeScript API. The document-reader and rich-editor scenes consume the same prototype.

## Purpose and limits

Blockquote gives a sourced passage its own reading space: an editorial excerpt, a policy quotation, a research finding, or a quoted reply. Keep short inline quotations in native `q`. Use Alert for a current status or actionable warning, and Card for a general container. A tone describes the quoted material; it never turns arbitrary instructions into a quotation or creates a live notification.

The figure is passive, with no hover, press, selected, disabled, loading, dismissal, copying action, or motion. Text remains selectable. Only embedded links have interaction states. Missing content belongs to the surrounding application's empty state; a quote with no text does not paint an empty panel. No attribution is required, and its absence leaves no reserved caption gap. The literal attribution `0` is supported. Empty strings, null, undefined, and booleans omit the caption. Empty rich-text wrappers should be omitted by the consumer.

## Anatomy and sizing

A native `figure` contains a body row with optional leading/trailing decorative glyphs and a `blockquote`, followed by an optional `figcaption`. Attribution is outside the quoted content. `citeUrl` supplies the blockquote's source metadata and does not create a visible link; use a Link in the caption when navigation is useful. A source work title may use `cite`; an author or team name is ordinary text. Source titles use upright type here, leaving emphasis within the quotation available to its author.

| Metric              | S      | M (default) | L      |
| ------------------- | ------ | ----------- | ------ |
| Body scale          | body-s | body-m      | body-l |
| Vertical padding    | 12px   | 16px        | 24px   |
| Horizontal padding  | 16px   | 24px        | 32px   |
| Decorative glyph    | 14px   | 16px        | 20px   |
| Glyph-to-text gap   | 12px   | 12px        | 12px   |
| Caption             | body-s | body-s      | body-s |
| Body-to-caption gap | 8px    | 8px         | 8px    |

The body uses regular upright type with the corresponding body line-height. Preserve `em`, `strong`, Code, lists, and links. The base does not automatically add quotation-mark characters, italicize paragraphs, or wrap children in `p`. Neighboring block children have a 12px rhythm; list items have 4px between them and a 24px logical indent. A short direct text child is valid.

The leading glyph aligns to the first body line and the trailing glyph to the last body line, never to the caption. Both are decorative and hidden from assistive technology. `iconLeft` and `iconRight` are logical start/end slots despite the prototype names. In RTL their placement mirrors; the glyph itself retains its supplied shape. The specimen supplies an opening and a closing quotation glyph for paired marks. Do not auto-mirror non-directional quote artwork. Caption edges align to the body text, taking both glyph columns into account. Omitted glyphs reserve no space.

S fits dense document prose and source previews. M is the ordinary reading passage; L is a featured excerpt, not a display testimonial system. At 120% text, body and caption scale once while padding and glyph size stay fixed. At narrow widths the reading scale and outer padding stay fixed. When the figure’s content box is at most 20rem wide, decorative marks move to their own rows above/below the body with an 8px gap; the closing mark aligns to the logical end. Text and caption then use the entire content width without reserved glyph columns. This container-based change also applies inside a narrow Card or Overlay, regardless of the page width.

## Material and color

The quotation has no background fill, perimeter frame, elevation, hover glow, or backdrop filter. Only the logical leading rail marks its boundary. Canvas, Card, colored content, and Overlay remain visible without another tonal panel; the quote also preserves any inherited inline Code context. The rail's own corner treatment belongs to the theme.

A logical leading rail spans the figure, inset 8px at each block edge, grouping the passage and attribution. The theme owns three recipes: `--blockquote-rail-width`, `--blockquote-rail-style`, and `--blockquote-rail-radius`. Soft uses a rounded 3px solid rail, Frost a straight 2px solid rail, and Pixel a straight 3px double rail. The neutral rail uses `--border-strong`, independently of transparent pill borders and corner geometry.

Info/success/warning/danger color the rail with the corresponding status signal and the optional glyph with the status soft foreground. The body remains `--fg-secondary`, the caption `--fg-muted`. Color supports the quoted meaning; explicit source/context wording must carry that meaning when color is absent. The caption stays at full text opacity and readable contrast. Do not make an entire long quotation red or yellow merely because its source includes a caution.

A nested quotation keeps its own rail and a 4px vertical inset, with no trailing padding. Both quotation levels are transparent, preserving reading width and the host material. The specimen shows one useful level, neutral and undecorated; applications should flatten deeply threaded excerpts rather than build a narrow staircase. There is no hidden depth truncation.

## Overflow, focus, and system modes

The figure has no fixed height, internal scrollbar, ellipsis, or collapse affordance. Long passages, URLs, source titles, and code fragments wrap completely. Text starts at the logical reading edge. The source metadata does not force language direction; Latin Code isolates its own LTR run inside RTL prose. The entire figure respects native `hidden`.

Tab visits embedded links in document order; the figure and glyphs add no stops. Links retain their underline, hover treatment, and 2px keyboard focus contour at 3px offset. There is no clipping or overflow-hidden on the figure, so wrapped links and focus outlines remain visible. Enter follows the source using normal browser navigation, without making the whole quote clickable. Native text selection covers only selected characters, not the figure background.

Forced colors retain a system-text rail, body, caption, and glyphs over the inherited system surface. Links retain their system link color and focus treatment. Tone distinctions collapse to textual context. Reduced motion is identical because the quotation has no animation.

## Inspection and implementation boundary

The live specimen covers `sizes`, `tones`, `anatomy` (text only, author, source, leading/trailing/paired marks), `content` (paragraphs, emphasis, Code, lists, source link, nested excerpt), `overflow`, `surfaces`, and `overlay`. The floating surface is explicitly a static Popover material study. The source links and native text selection are real interactions. Existing application compositions use S deliberately alongside their compact prose.

Inspect all six presets, Base and real Overlay plates, 360/768/1280/1440px, 120% text, and RTL. Check long captions, paired marks, nested excerpts, and focus as visual compositions, not just overflow numbers. Library implementation resolves the final prop types, ref target contract, native attribute ownership, and runtime protection against HTML replacement while preserving this anatomy and experience. It must verify full cross-browser semantics and system-mode behavior; this candidate does not claim those production guarantees.
