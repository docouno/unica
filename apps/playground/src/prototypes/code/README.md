# Code — design reference

Status: candidate for visual review. Open `/?item=code` in the playground. This is an inline typography reference, not a package export or a final TypeScript API. The neighboring `CodeBlock` sketch is outside this reference's scope.

## Purpose and anatomy

Use one native inline `code` element for a function, path, option, configuration value, or short command in prose. It remains ordinary selectable text. Code is not a copy button, a keyboard key, a status badge, or a fenced listing. It adds no hover, press, focus, disabled, loading, tooltip, or Tab stop. The surrounding application explains an unavailable or missing value; do not show an empty chip. The numeric value `0` remains visible.

## Typography and material

The default inherits the surrounding size and weight. `--code-font-scale` supplies a 0.9 optical ratio beside Inter in Soft/Frost, and 1 beside JetBrains Mono in Pixel. Reset letter spacing to normal so a heading's negative tracking does not squeeze technical identifiers. Font scale at 120% comes from the parent once. Inline code must not enlarge the parent's line boxes; the prototype uses a zero inline line-height while native glyphs and padding remain painted. Standalone S/M/L explicitly use the corresponding body size, optical ratio, and body line-height.

The plate has 4px horizontal padding, 0.08em vertical padding, and `--radius-xs` corners: 4px in Soft/Frost and square in Pixel. Soft uses the borderless neutral soft fill. Frost and Pixel use their existing 1px neutral border and soft fill. No shadow, blur, movement, or transition belongs to this text primitive. The plate remains a quiet tonal step on canvas, Card, colored messages, and real floating surfaces.

The default tone is inherited. A painted surface publishes a ready-made `--code-context-bg`, `--code-context-fg`, and `--code-context-border` pair for its descendants. Card and Overlay supply neutral ink; Alert supplies its status ink. The context plate is an 8% ink veil, controlled by the theme's `--code-plate-tint`, over the actual surface. It stays in that surface's color family while remaining distinct. Frost preserves its real backdrop without another blur or a repeated glass fill. Text and transparent Blockquote pass context through unchanged; an opaque nested Card establishes a neutral context. Local Text color does not recolor the plate. An arbitrary custom background must declare its own context; Code does not inspect ancestor pixels.

Outside a declared context, Code falls back to the neutral soft pair. Explicit neutral/info/success/warning/danger override the context and mix the same 8% foreground into their semantic soft background, retaining their semantic foreground and border. The neutral fallback is identical to explicit neutral. This extra tonal step also keeps explicit same-tone Code distinct inside an Alert. Use a status override only when the literal itself has that meaning; keep an explicit explanation beside it. An error identifier mentioned neutrally in a reference need not be red.

Plate presence and tone are independent. With the inherited tone, `plate={false}` removes the plate and inherits the immediate text foreground. Use this in Button and Link, whose host owns hover, focus, contrast, and disabled presentation. Colored messages support both the default contextual plate and this plain alternative. Removing the plate from an explicit tone retains its semantic foreground; the consumer verifies that combination's contrast.

## Content and direction

Code stays inline, uses `white-space: break-spaces`, and preserves significant spaces. Long strings wrap anywhere only when needed, without clipping, ellipsis, or an internal scrollbar. Native selection and copying return the original text, without inserted break characters. `box-decoration-break: slice` treats a wrapped literal as one continuous plate: the first/last fragment carries its leading/trailing edge; intermediate fragments remain open. Do not round each wrapped fragment into a separate chip.

The default LTR isolated run preserves the source order of Latin paths, punctuation, flags, and expressions in an RTL page. An explicit `dir="auto"` or `dir="rtl"` can describe a literal that needs another base direction. Do not force an entire surrounding sentence to LTR. Hidden code paints nothing. Empty content paints no padding or border. Use CodeBlock for meaningful multi-line listings rather than turning Code into a block component.

Selection uses the browser's native highlight. Forced colors replace plated foreground/background with system colors and retain a thin contour; unplated code keeps the host's system foreground and has no contour. The component has no motion, so reduced motion produces the same result.

## Inspection and handoff

`reading` covers headings, body, captions, and multiple tokens. `sizes` covers standalone values. `tones` covers status meanings. `wrapping` covers long paths, punctuation, significant spaces, and zero. `surfaces`, `messages`, `boundaries`, and `overlay` show actual host materials, context inheritance, and an opaque nested reset; the overlay panel is a static material study. `controls` provides real Button/Link hover and keyboard focus, not simulated Code states. Existing document-reader tables, runbook prose, and rich-editor paragraphs consume the same prototype.

Inspect all six presets at 360/768/1280/1440px, 120% text, and RTL. The implementation must preserve baseline rhythm, full text, native selection, and host action contrast. Its exact types, ARIA naming restrictions for the native code role, ref behavior, and cross-engine text-fragment verification belong to the library stage. Do not interpret this prototype as proof of a finished cross-browser package.
