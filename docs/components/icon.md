# Icon

`Icon` renders one non-interactive SVG. Pass a Phosphor component directly or use `defineGlyph` to register a project SVG with its own adapter. Import the package stylesheet once in the application.

```tsx
import { Icon } from '@docouno/unica';
import { ArrowRightIcon, WarningCircleIcon } from '@phosphor-icons/react';
import '@docouno/unica/styles.css';

<>
  <Icon icon={WarningCircleIcon} color="warning" aria-label="Sync delayed" />
  <button type="button">
    Continue <Icon icon={ArrowRightIcon} usage="slot" directional />
  </button>
</>
```

## Props

| Prop | Behavior |
| --- | --- |
| `icon` | A callable SVG component or a descriptor returned by `defineGlyph`. The source accepts SVG props and a React 19 ref to its root SVG. Source-specific props must be optional. |
| `size` | `inherit` uses a square `1em` frame. `s`, `m`, and `l` use `--size-s-icon`, `--size-m-icon`, and `--size-l-icon` (14, 16, and 20px by default). For a standalone icon, the nearest `UnicaProvider` override and then the active theme defaults apply when size is omitted. The built-in default is `inherit`. A slot with no explicit size always uses `1em` of the owner. |
| `color` | `inherit` (default), `primary`, `secondary`, `muted`, `subtle`, `disabled`, `accent`, `info`, `success`, `warning`, or `danger`. The five foreground roles use `--fg-*`, accent uses `--accent-signal`, and status colors use `--status-*-signal`. |
| `directional` | Reflects the drawing only in RTL. Set it on logical arrows and carets. When enabled it takes precedence over Phosphor's physical `mirrored` flag. |
| `usage` | `standalone` (default) supports accessible naming. `slot` is decorative and takes its name and default size from its owner. |
| `aria-labelledby`, `aria-label`, `children` | Name a standalone image through ID references, text, or one direct text-only SVG `<title>`. |
| `ref`, `id`, `className`, `style`, `data-*` | Pass through to the root SVG. The frame size and semantic color take precedence over competing inline style properties. |
| Source options | TypeScript infers options from `icon`, including the six Phosphor `weight` values and `mirrored`. For a choice between sources, pass options supported by every possible source or narrow the choice first. |

Use an explicit `dir="rtl"` or `dir="ltr"` on the owning region for directional icons on Chrome and Edge 114–119. Newer browsers also resolve automatic text direction through `:dir()`.

The source's `viewBox` controls drawing proportions inside the square. Use `currentColor` for strokes or fills that should track text and control states. Authored fills and strokes remain available for multicolor SVGs. Monochrome glyphs follow the owner's system color in forced-colors mode.

## Sources and adapters

```tsx
import { Icon, IconProvider, defineGlyph } from '@docouno/unica';
import type { ComponentPropsWithRef } from 'react';

function ProjectMark({ children, ...props }: ComponentPropsWithRef<'svg'>) {
  return (
    <svg {...props} viewBox="0 0 32 16">
      {children}
      <path fill="currentColor" d="M0 0h32v16H0z" />
    </svg>
  );
}

const ProjectGlyph = defineGlyph(ProjectMark);

<IconProvider adapter="phosphor">
  <Icon icon={ProjectGlyph} size="l"><title>Project mark</title></Icon>
</IconProvider>
```

A bare component uses the nearest `IconProvider`, with `phosphor` as the default. A module-scoped `defineGlyph(source, adapter?)` wraps a source in an immutable descriptor and pins its adapter, defaulting to `native`. Sources with repeated clip paths, masks, or gradients should create instance IDs with React's `useId`.

The built-in Phosphor adapter defaults standalone icons to `regular`, including when `weight={undefined}`. A slot may inherit its weight from the application's Phosphor `IconContext`. An explicit weight takes precedence. Icon owns frame size, root paint, reflection, and accessibility fields, including competing `role`, `aria-hidden`, `aria-label`, `aria-labelledby`, `focusable`, and `tabIndex` in Phosphor 2.1.10 context. Monochrome Phosphor paths keep the semantic color when a supplied inline style also specifies `fill`. Use that context for supported styling options. Set `ref` on `Icon`, geometry such as `viewBox` and `preserveAspectRatio` in the source, and event handlers on the surrounding control. Keep these fields out of the vendor context.

A custom `IconAdapter` receives the source and an `IconAdapterRenderContext` with `inputProps`, `svgProps`, and `usage`. Call it as a pure function. Apply optional source props first and the owner's `svgProps` last. Pass the resulting ref, attributes, and title to one root SVG. A custom adapter may render another compliant SVG or return `null` to omit the drawing and clear the ref.

```tsx
import { createElement } from 'react';
import type { IconAdapter } from '@docouno/unica';

const adapter: IconAdapter = (Source, { inputProps, svgProps }) =>
  createElement(Source, { ...inputProps, ...svgProps });
```

## Accessibility

With a name, a standalone Icon exposes `role="img"`. The browser resolves a valid `aria-labelledby` first, then `aria-label`, then the SVG title. A direct SVG title may include interpolated text and an `id` referenced by `aria-labelledby`. Blank strings do not supply a name. Decorative icons and slots expose `aria-hidden="true"`. Give icon-only controls their own accessible name and accompany semantic status colors with text.

Icon skips keyboard focus and has no form value or reset behavior. Put actions on a button or link.

## Package entry

The normal ESM entry exports `Icon`, `IconProvider`, `defineGlyph` and the types `BuiltinIconAdapterName`, `GlyphComponent`, `GlyphDefinition`, `GlyphSource`, `IconAdapter`, `IconAdapterRenderContext`, and `IconProps`. It works with React DOM SSR and hydration. The `react-server` entry exposes the theme catalog and type exports. Applications install their chosen icon library separately.
