# Blockquote

Use `Blockquote` for a quoted passage with optional credit. The native `<figure>` contains a `<blockquote>` and an optional final `<figcaption>`. Put short inline quotations in a native `<q>`.

```tsx
import { Blockquote, Code } from '@docouno/unica';
import '@docouno/unica/styles.css';

<Blockquote
  citeUrl="/handbook/recovery"
  attribution={<a href="/handbook/recovery"><cite>Recovery handbook</cite></a>}
>
  <p>Set the retry timeout before running <Code>recover</Code>.</p>
</Blockquote>
```

## Props

| Prop | Values | Default | Effect |
| --- | --- | --- | --- |
| `children` | React node | — | Quoted text, paragraphs, lists, and other flow content. An empty body hides the figure. |
| `attribution` | React node | — | Source credit in a figcaption. Empty strings, null, undefined, and booleans omit it. Zero is visible. |
| `citeUrl` | String | — | Source metadata on the native blockquote. Authors can add a visible link in the credit or body. |
| `size` | `s`, `m`, `l` | `m` | Body typography, padding, and glyph frame. The caption uses body-s. |
| `status` | `neutral`, `info`, `success`, `warning`, `danger` | `neutral` | Semantic color of the rail and glyphs. Body and caption keep their reading colors. |
| `iconLeft`, `iconRight` | [`GlyphSource`](icon.md) | — | Optional decorative marks at logical start and end. Pass a glyph component for the active adapter or use `defineGlyph` to attach an adapter to the source. |
| `ref` | `Ref<HTMLElement>` | — | React 19 ref to the native figure. |

The package exports `BlockquoteProps` and `BlockquoteStatus`. Native attributes and event handlers, including `id`, `dir`, `hidden`, `className`, `style`, and ARIA attributes, apply to the figure. The component reserves `role`, `tabIndex`, and `dangerouslySetInnerHTML`. In a rich-text editor, `contentEditable={false}` marks the excerpt read-only. An omitted or inherited setting follows the editor.

## Layout and accessibility

The figure is transparent on Base and Overlay and passes the host's [Code](code.md) context through. Its rail follows the logical reading edge and uses the active theme's width, line style, and corner treatment. In a nested quote, the vertical inset and trailing padding contract to preserve reading space.

The figure fills its available inline size. Marks align with the first and last lines of the passage, and the caption aligns with the passage text. At a figure content width of 20rem or narrower, the marks move into their own rows and the passage and caption use the full content width. A missing glyph takes no space. In RTL the slots exchange physical sides and retain their artwork.

Text remains selectable. Tab reaches embedded links in document order and Enter activates them natively. Decorative glyphs and the figure add no Tab stops or submitted fields. Forced colors preserve a visible rail, text, and glyphs, while links retain their own focus treatment. The component has no motion.
