# Code — design reference

Status: candidate for visual review. Open `/?item=code` in the playground. This is an inline typography reference, not a package export or a final TypeScript API. The neighboring `CodeBlock` sketch is outside this reference's scope.

## Purpose and anatomy

Use one native inline `code` element for a function, path, option, configuration value, or short command in prose. It remains ordinary selectable text. Code is not a copy button, a keyboard key, a status badge, or a fenced listing. It adds no hover, press, focus, disabled, loading, tooltip, or Tab stop. The surrounding application explains an unavailable or missing value; do not show an empty chip. The numeric value `0` remains visible.

## Typography and material

The default inherits the surrounding size and weight. `--code-font-scale` supplies a 0.9 optical ratio beside Inter in Soft/Frost, and 1 beside JetBrains Mono in Pixel. Reset letter spacing to normal so a heading's negative tracking does not squeeze technical identifiers. Font scale at 120% comes from the parent once. Inline code must not enlarge the parent's line boxes; the prototype uses a zero inline line-height while native glyphs and padding remain painted. Standalone S/M/L explicitly use the corresponding body size, optical ratio, and body line-height.

The plate has 4px horizontal padding, 0.08em vertical padding, and `--radius-xs` corners: 4px in Soft/Frost and square in Pixel. Soft uses the borderless neutral soft fill. Frost and Pixel use their existing 1px neutral border and soft fill. No shadow, blur, movement, or transition belongs to this text primitive. The opaque plate remains legible on canvas, Card, and a real floating surface without another overlay recipe.

Use neutral for ordinary literals. Info/success/warning/danger use the existing semantic soft foreground, background, and border tokens only when the literal itself expresses a meaningful status. Keep an explicit explanation beside it; color alone is insufficient. An error code mentioned neutrally in a reference need not be red.

Plate presence and foreground inheritance are independent. In a Button, Link, or colored message, remove the plate and inherit the host's foreground (`plate={false} tone="inherit"` in this prototype). The host owns hover, focus, contrast, and disabled presentation. Removing only the plate retains the chosen semantic foreground; this is appropriate only where the consumer verifies contrast. A plated inherited foreground likewise requires a compatible parent color.

## Content and direction

Code stays inline, uses `white-space: break-spaces`, and preserves significant spaces. Long strings wrap anywhere only when needed, without clipping, ellipsis, or an internal scrollbar. Native selection and copying return the original text, without inserted break characters. `box-decoration-break: slice` treats a wrapped literal as one continuous plate: the first/last fragment carries its leading/trailing edge; intermediate fragments remain open. Do not round each wrapped fragment into a separate chip.

The default LTR isolated run preserves the source order of Latin paths, punctuation, flags, and expressions in an RTL page. An explicit `dir="auto"` or `dir="rtl"` can describe a literal that needs another base direction. Do not force an entire surrounding sentence to LTR. Hidden code paints nothing. Empty content paints no padding or border. Use CodeBlock for meaningful multi-line listings rather than turning Code into a block component.

Selection uses the browser's native highlight. Forced colors replace plated foreground/background with system colors and retain a thin contour; unplated code keeps the host's system foreground and has no contour. The component has no motion, so reduced motion produces the same result.

## Inspection and handoff

`reading` covers headings, body, captions, and multiple tokens. `sizes` covers standalone values. `tones` covers status meanings. `wrapping` covers long paths, punctuation, significant spaces, and zero. `surfaces` and `overlay` show actual host materials; the overlay panel is a static material study. `controls` provides real Button/Link hover and keyboard focus, not simulated Code states. Existing document-reader tables, runbook prose, and rich-editor paragraphs consume the same prototype.

Inspect all six presets at 360/768/1280/1440px, 120% text, and RTL. The implementation must preserve baseline rhythm, full text, native selection, and host action contrast. Its exact types, ARIA naming restrictions for the native code role, ref behavior, and cross-engine text-fragment verification belong to the library stage. Do not interpret this prototype as proof of a finished cross-browser package.
