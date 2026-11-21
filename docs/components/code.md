# Code

Use `Code` for a technical literal in a sentence, heading, table, or control. It renders a native `<code>` and keeps the text available to browser selection and copying. For a multiline listing, use `<pre><code>…</code></pre>`.

```tsx
import { Code } from '@docouno/unica';
import '@docouno/unica/styles.css';

<>
  <p>Set <Code>maxAttempts</Code> to <Code>3</Code>.</p>
  <a href="/reference"><Code plate={false}>AbortSignal</Code> reference</a>
</>
```

## Props

| Prop | Values | Default | Effect |
| --- | --- | --- | --- |
| `children` | React node | — | Inline content. An empty literal has no painted plate. Zero is visible. |
| `size` | `inherit`, `s`, `m`, `l` | `inherit` | Inherit the surrounding scale and line rhythm or use the matching body size and line height. |
| `tone` | `inherit`, `neutral`, `info`, `success`, `warning`, `danger` | `inherit` | Follow the painted surface or use an explicit semantic color. |
| `plate` | Boolean | `true` | Paint the contextual background and edge. Set to `false` for a bare literal. |
| `dir` | `ltr`, `rtl`, `auto` | `ltr` | Base direction of the isolated run. |
| `ref` | `Ref<HTMLElement>` | — | React 19 ref to the native code element. |

The package exports `CodeProps` and `CodeTone`. Native attributes and events such as `id`, `lang`, `hidden`, `aria-describedby`, and `onCopy` belong to the code element. The native code role prohibits author-supplied names. The component reserves `role`, `tabIndex`, `dangerouslySetInnerHTML`, `aria-label`, and `aria-labelledby`. Inside a rich-text editor, set `contentEditable={false}` to create a read-only fragment. Omit it or use `"inherit"` to follow the editor.

## Typography and color

Code keeps the surrounding font weight. Its monospace size uses a factor of 0.9 in Soft and Frost and 1 in Pixel. Significant spaces are preserved. Long literals wrap at the available line width, with the plate continuing across lines. A default LTR run preserves punctuation order for paths and CLI flags inside RTL prose. Set `dir="auto"` or `dir="rtl"` for literals that need a different direction.

An inherited plate uses the nearest painted surface's `--code-context-bg`, `--code-context-fg`, and `--code-context-border`. Overlay and painted containers supply these values. Transparent wrappers such as [Blockquote](blockquote.md) pass the context through. With no context, the plate uses the neutral soft colors. An explicit tone always uses its semantic colors. With `plate={false}` and an inherited tone, Code takes the host foreground, which is useful in links and buttons.

Code is passive in forms and adds no Tab stop or submitted field. Forced colors give the plate a system-colored edge and let bare code inherit its host foreground. The component has no motion.
