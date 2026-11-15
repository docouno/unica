# Kbd & KbdGroup — visual specification

Status: approved visual design (2026-11-15). Open `/?item=kbd` in the playground. These prototypes establish appearance and intended user experience; they are not package exports or the final TypeScript API.

## Purpose and composition

Kbd identifies keyboard input in instructions, search, menu hints, tooltips, actions, and shortcut reference lists. It is passive: no focus stop, pointer handler, key listener, recording, rebinding, or automatic operating-system detection. Code remains the component for identifiers and commands. The application chooses the platform, notation, localized names, and whether the shortcut is actually available.

- A single letter or symbol gets a square cap. Named keys such as `Enter`, `Space`, `Page Down`, and localized names expand horizontally without truncation.
- KbdGroup separates simultaneous keys with `+` by default. Empty separators give compact macOS notation with a small gap; the accessible text still says “plus”.
- A visible, spoken `then` separates sequential keys or chord groups. `G then I` means release G before pressing I. “Or” between two independent groups presents alternatives, not a chord.
- A short composite hint such as `⌘K` may share one plate in dense search, menu, or toolbar chrome. Use individually framed keys in instructions where the physical inputs need emphasis. A single plate is not a shortcut parser.
- No assigned shortcut is ordinary text such as “Not assigned”, never an empty cap. Empty Kbd content renders nothing. Groups should contain actual keys or groups; filter absent assignments before composing them.

Examples show free text and common self-contained SVG symbols: Command, Option, Control, Shift, Return/Enter, Backspace, Tab, and directional arrows. There is no required enum of key names. Physical left/right keys keep their direction in RTL; the shortcut's order stays LTR while its surrounding layout follows the document.

## Geometry and typography

`inherit` is the default. Let P be the surrounding font size and L its explicit line height. The outer cap keeps the parent's font metrics, uses `height = min-inline-size = L`, and seats at the bottom of the line box. Its inner face uses `F = 0.9 × min(P, L − 4px)`. This separate inner face avoids shrinking the inherited line-height unit. One-pixel borders and symmetric padding keep the face centered; a symbol occupies F × F, a letter uses its normal monospace advance, and the minimum width preserves the square.

| Size    | Base P / L     | Face F        | Use                                                |
| ------- | -------------- | ------------- | -------------------------------------------------- |
| inherit | Parent metrics | Formula above | Inline Text/Title, Button, Tooltip, compact chrome |
| s       | 14 / 20px      | 12.6px        | Dense reference rows and small hints               |
| m       | 16 / 24px      | 14.4px        | Standalone keyboard guidance                       |
| l       | 18 / 28px      | 16.2px        | Prominent shortcut guidance                        |

The 120% text setting scales the explicit sizes' P and L; inherited sizes follow the parent. The border remains 1px. Group size passes through without repeatedly reducing nested keys. An explicit child size takes precedence; mixed sizes are possible for inspection but are not recommended in ordinary chords. Group gap is 0.25em; visible separators are 0.8em at regular weight. The face uses the theme's mono family, normal style, weight 500, and normal letter spacing even inside an italic or bold sentence.

Mixed glyph/text hints share one typographic line. The SVG's center aligns with the font's capital-height center using `vertical-align: (1cap − 1em) / 2`, with a `−0.14em` fallback where `cap` units are unavailable. Adjacent parts retain a 0.125em gap. Do not independently flex-center the SVG and text boxes: font metrics reserve space below the baseline, leaving letters visibly higher than the symbols in small hints. Center the resulting line inside the existing cap; the outer dimensions stay unchanged.

Inline `inherit` is designed to preserve the host's line height, not the paragraph's number of lines: a wider chord can naturally wrap onto another line. Explicit sizes can increase a smaller host line. Use an explicit numeric line height for predictable inherited geometry. Prefer caption-l or larger for essential keyboard instructions; the smallest captions are not an appropriate place for symbol-heavy guidance.

## Material and surrounding state

There are zero decorative variants, semantic tones, or inverse switches on Kbd. The neutral face and border consume `--kbd-cap-bg` and `--kbd-cap-border`; `--kbd-cap-shadow` owns the inner edge recipe. Soft/Frost use the system's 4px radius; Pixel uses 0px.

| Family | Appearance                                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Soft   | Quiet matte plate with a subtle 1px inner lower edge.                                                                   |
| Frost  | Opaque, cool micro-cap with a 1px lower edge and restrained top highlight. The surrounding overlay owns glass and blur. |
| Pixel  | Sharp structural outline with a crisp 2px inner lower step, no diffuse shadow.                                          |

All depth stays inside the cap box. Nothing protrudes into neighboring text, and the cap itself never animates or moves. There is no independent hover, focus, held, selected, error, or loading state.

Inside Button, the cap inherits the actual action foreground. A transparent face and 28% foreground contour retain key anatomy without inserting an unrelated neutral tile into a filled action. A foreground wash would reduce the contrast of the small glyph, so the face preserves the action's background. The plate has no independent depth. This works for accent, neutral, and danger actions, including secondary/ghost and transient owner states. These internal contextual handles are composition glue, not additional public variants. The owner supplies the focus ring and any press movement. A disabled action gives the cap muted ink, a quiet contour, and no depth; the cap does not make the action operable. Loading hides it with the owner's full content row while retaining layout and focus. Disabled takes precedence if both states are supplied.

Canvas, surface, field, and overlay consumers retain the normal neutral recipe. A tooltip or menu does not add a second glass layer to each cap. The search and menu consumers use the shared geometry rather than locally repainting it. In forced colors, the cap has Canvas/CanvasText with a visible outline and no shadow; disabled action hints use GrayText. Kbd has no motion to suppress under reduced motion.

## Narrow layouts and long content

A chord and its separators form one unbroken unit. Wrap the entire chord below its command label when space is limited. Do not orphan a plus sign, clip the final key, insert an ellipsis, or break a key name between letters.

Short sequential groups are also atomic. For a long multi-step instruction, compose separate chord groups and keep each connective with the next step, as the specimen's long sequence demonstrates. A reference containing a chord wider than its available space can use a labeled, keyboard-scrollable horizontal region; it must preserve the complete names. Prefer compact platform notation or a separate reference row before adding scrolling to ordinary inline prose.

## Accessible experience and preview boundaries

Plain key names remain native text inside `<kbd>`. The prototype gives its built-in symbols readable hidden text and hides the visual SVG from accessibility APIs. A supplied `label` replaces that spoken content for custom glyphs or localized naming. Separators remain available to assistive technology so chords, sequences, and alternatives have distinct meanings. Do not put a bare `aria-label` on an unnamed native `<kbd>` and hide all of its content.

If a shortcut hint repeats information already provided by an action's accessible description, the consumer may hide that hint from assistive technology. `aria-keyshortcuts` belongs on the actual command and only when that command is implemented; displaying a cap never installs a shortcut. The specimen's action responds to native click/Enter/Space but does not implement the displayed global shortcuts. Search is a real local input; tooltip and menu examples are fixed surfaces, with a clearly pinned highlighted row. They demonstrate placement, not a complete overlay engine.

The action state/weight/tone controls let reviewers inspect inherited appearance. Hover, press, and focus options pin a visual state; choosing Rest restores the native action interaction. Full reusable state, ref, SSR, accessibility API, and browser guarantees are the subsequent library task. That task preserves these visual and user-facing decisions while choosing its own architecture.

Relevant composition consumers are the shared global search, rich-editor shortcut hints, and the preferences shortcut reference. They remain separate application scenes rather than copies inside this specimen.
