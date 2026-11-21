# Icon

`Icon` renders one non-interactive SVG. Pass a Phosphor component directly or use `defineGlyph` to register a project SVG or third-party icon component with its own adapter. Import the package stylesheet once in the application.

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
| `icon` | A callable SVG component (including `React.FC`, SVGR imports, `forwardRef`, and `memo` components) or a descriptor returned by `defineGlyph`. The source accepts `GlyphSvgProps` and a React 19 ref to its root SVG. Calling the source with frame props alone must be valid. Passing `undefined` omits a source option. A source may require a value for related options when a caller selects a specific mode. |
| `size` | `inherit` uses a square `1em` frame. `s`, `m`, and `l` use `--size-s-icon`, `--size-m-icon`, and `--size-l-icon` (14, 16, and 20px by default, with matching fallback SVG dimensions before CSS loads). For a standalone icon, the nearest `UnicaProvider` override (merged by axis) and then the active theme defaults apply when `size` is omitted. The built-in default is `inherit`. A slot with no explicit size always uses `1em` of the owner. |
| `color` | `inherit` (default), `primary`, `secondary`, `muted`, `subtle`, `disabled`, `accent`, `info`, `success`, `warning`, or `danger`. The five foreground roles use `--fg-*`, accent uses `--accent-signal`, and status colors use `--status-*-signal`. |
| `directional` | Reflects the drawing only inside explicit `dir="rtl"` regions (`dir="ltr"` resets the direction inside nested regions). Set it on logical arrows and carets. When enabled it takes precedence over Phosphor's physical `mirrored` flag. |
| `usage` | `standalone` (default) supports accessible naming. `slot` is decorative and takes its name and default size from its owner. |
| `aria-labelledby`, `aria-label`, `children` | Name a standalone image through ID references, text, or one direct text-only SVG `<title>` (supporting conditional `false`/`null` children and text fragments). |
| `ref`, `id`, `className`, `style`, `data-*` | Pass through to the root SVG. Inline `style` and unlayered consumer CSS follow standard CSS cascade over `@layer unica.components`. |
| Source options | TypeScript infers options from `icon`, including Phosphor `weight` and `mirrored`, Lucide `strokeWidth` and `absoluteStrokeWidth`, Tabler `stroke`, and custom component options. For a choice between sources, including one passed to `defineGlyph`, pass options supported by every candidate or narrow the choice first. |

Use an explicit `dir="rtl"` or `dir="ltr"` on the owning region for directional icons so direction mirroring works consistently across supported browsers and CSS bundlers without bundler-specific selector configuration.

The source's `viewBox` controls drawing proportions inside the square. Use `currentColor` for strokes or fills that should track text and control states. Authored fills and strokes remain available for multicolor SVGs. Monochrome glyphs follow the owner's system color in forced-colors mode, while unlayered application rules remain able to override forced-color ink when needed.

## Sources and adapters

```tsx
import { Icon, IconProvider, defineGlyph } from '@docouno/unica';
import type { GlyphSvgProps } from '@docouno/unica';

function ProjectMark({ children, ...props }: GlyphSvgProps) {
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

Every accepted source can render with just the Icon frame props. TypeScript infers extra options from the final call signature of an overloaded component. Give that signature the union of supported option shapes to expose every mode through Icon.

A bare component uses the nearest `IconProvider`, with `phosphor` as the default. A module-scoped `defineGlyph(source, adapter?)` wraps a source in an immutable descriptor and pins its adapter, defaulting to `native`. Sources with repeated clip paths, masks, or gradients should create instance IDs with React's `useId`.

The built-in Phosphor adapter defaults standalone icons to `regular`, including when `weight={undefined}`. A slot may inherit its weight from the application's Phosphor `IconContext`. An explicit weight takes precedence. Icon owns frame size, root paint, reflection, and accessibility fields, including competing `role`, `aria-hidden`, `aria-label`, `aria-labelledby`, `focusable`, `tabIndex`, and `style` in Phosphor `IconContext`. Set `ref` on `Icon`, geometry such as `viewBox` and `preserveAspectRatio` in the source, and event handlers on the surrounding control. Keep these fields out of the vendor context.

A custom `IconAdapter` receives the source and an `IconAdapterRenderContext` with `inputProps`, `svgProps`, and `usage`. `Icon` invokes the adapter inline during render as a plain JS function — **do not call React hooks directly inside `IconAdapter`** (if an adapter needs hooks such as context or `useId`, return a React element of a component that calls those hooks). Apply optional source props first and the owner's `svgProps` last. Pass the resulting ref, attributes, and title to one root SVG. A custom adapter may render another compliant SVG or return `null` to omit the drawing and clear the ref.

```tsx
import { createElement } from 'react';
import type { IconAdapter } from '@docouno/unica';

const adapter: IconAdapter = (Source, { inputProps, svgProps }) =>
  createElement(Source, { ...inputProps, ...svgProps });
```

## Accessibility

With a name, a standalone Icon exposes `role="img"`. The browser resolves a valid `aria-labelledby` first, then `aria-label`, then the SVG title. A direct SVG `<title>` may include interpolated text, fragments, `id` (referenced by `aria-labelledby`), `lang`, and `dir`. Blank strings do not supply a name. Decorative icons and slots expose `aria-hidden="true"`. Give icon-only controls their own accessible name and accompany semantic status colors with text.

Icon skips keyboard focus and has no form value or reset behavior. Put actions on a button or link.

## Package entry

The normal ESM entry exports `Icon`, `IconProvider`, `defineGlyph` and the types `BuiltinIconAdapterName`, `GlyphComponent`, `GlyphDefinition`, `GlyphSource`, `GlyphSvgProps`, `IconAdapter`, `IconAdapterRenderContext`, `IconColor`, `IconProps`, `IconProviderProps`, `IconSize`, and `IconUsage`. It works with React DOM SSR and hydration.

In React Server Components, render `Icon` and `IconProvider` inside a `'use client'` module boundary. The `react-server` entry exposes `THEME_PRESETS`, `defineGlyph`, and all type exports so shared icon registries can define descriptors without loading client hooks or stylesheets. Applications install their chosen icon library separately.
