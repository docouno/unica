# Geometry and Layout

Unica governs spatial rhythm, corner curvature, surface elevation, and responsive composition through a shared parametric geometry contract. Switching between rounded themes (`Soft`, `Frost`) and sharp technical themes (`Pixel`) requires zero layout changes.

## Parametric Radius Scales & `--radius-factor`

Corner curvature separates **interactive controls** from **enclosing surfaces**, scaled uniformly by `--radius-factor` (`1` in `Soft` and `Frost`; `0` in `Pixel`):

```css
:root {
  --radius-factor: 1;
  --radius-xs: calc(4px * var(--radius-factor));
  --size-s-radius: calc(6px * var(--radius-factor));
  --size-m-radius: calc(8px * var(--radius-factor));
  --size-l-radius: calc(10px * var(--radius-factor));
  --surface-s-radius: calc(10px * var(--radius-factor));
  --surface-m-radius: calc(12px * var(--radius-factor));
  --surface-l-radius: calc(16px * var(--radius-factor));
  --radius-full: calc(9999px * var(--radius-factor));
  --radius-circular: 50%;
}

[data-theme^='pixel-'] {
  --radius-factor: 0;
}
```

| Token | `Soft` / `Frost` (`1`) | `Pixel` (`0`) | Scope |
| --- | --- | --- | --- |
| `--radius-xs` | `4px` | `0px` | Compact indicators, checkboxes, inline code |
| `--size-s-radius` | `6px` | `0px` | Small (`s`) controls and compact pills |
| `--size-m-radius` | `8px` | `0px` | Medium (`m`) controls (`Input`, `Button`, `Select`) |
| `--size-l-radius` | `10px` | `0px` | Large (`l`) controls |
| `--surface-s-radius` | `10px` | `0px` | Popovers, menus, tooltips, sub-cards |
| `--surface-m-radius` | `12px` | `0px` | Standard `Card`, `Alert`, picker panels |
| `--surface-l-radius` | `16px` | `0px` | `Modal`, hero containers |
| `--radius-full` | `9999px` | `0px` | Capsule & avatar shapes (`Badge`, `Chip`, `Switch` track, `Avatar`) |
| `--radius-circular` | `50%` | `50%` | True geometric circles (`Radio` indicator, `Spinner`) |

Size and surface classes assign `--element-radius`, giving child plates and `:focus-visible` outlines one resolved handle.

## Law of Concentricity ($R_{\text{inner}}$)

Whenever a rounded child element sits at inset $d$ inside a rounded parent container with outer radius $R_{\text{outer}}$, its inner corner radius follows:

$$R_{\text{inner}} = \min\!\Big(R_{\text{outer}},\ \max\!\big(\text{var(--radius-xs)},\ R_{\text{outer}} - d\big)\Big)$$

```css
.segmentedThumb {
  --thumb-inset: 2px;
  border-radius: min(
    var(--element-radius),
    max(var(--radius-xs), calc(var(--element-radius) - var(--thumb-inset)))
  );
}
```

- **Segmented rails & inset media:** A `SegmentedControl` thumb inset by `2px` inside an `8px` rail resolves to `6px`; inset `CardMedia` inside a `12px` card with `8px`–`12px` padding resolves to `4px` (`--radius-xs`) rather than collapsing to a sharp `0px` corner inside a rounded card.
- **Composable `AppShell.Stage` seam:** When both `TopRail` (`46px`) and `LeftRail` (`56px`) frame `AppShell.Stage`, its `1px` top-left seam uses `14px` outer / `13px` inner radii in `Soft` and `Frost`, collapsing cleanly to `0px` / `0px` in `Pixel`.
- **`Pixel` `0px` degeneration & circular `Radio` invariant:** Under `--radius-factor: 0`, `--radius-xs` and every rectangular or capsule radius resolve to `0px`, so $R_{\text{inner}} = 0\text{px}$ everywhere — buttons, cards, badges, avatars, checkboxes (`[x]`), and rectangular switches (`[ ■]`) snap to orthogonal corners. **`Radio` / `RadioCard` indicators and `Spinner` rings remain circular (`--radius-circular: 50%`, `(•)`)** across every theme so single-select choices stay unmistakably distinct from multi-select checkboxes without relying on color.

## Monotonic Z-Elevation of Surfaces

Workspace depth progresses monotonically from outer chrome to foreground cards and overlays without arbitrary per-screen backgrounds:

```text
AppRail (--bg-shell) < Aside (--bg-aside) < Main Canvas (--bg-canvas) < Card (--bg-surface)
```

- **Dark presets:** Luminance steps steadily upward from `--bg-shell` (deepest ground) through `--bg-aside` and `--bg-canvas` to `--bg-surface` and `--bg-overlay`.
- **Light presets:** Outer chrome (`--bg-shell`, `--bg-aside`) uses a quiet tinted ground so light canvases (`--bg-canvas`) and crisp elevated cards (`--bg-surface`) separate cleanly without heavy drop shadows.

## Unified `4px` Spacing & `s / m / l` Sizing

Spacing uses a ten-step `4px` scale (`--space-0`, `2`, `4`, `8`, `12`, `16`, `24`, `32`, `48`, `64`) with five semantic aliases (`xs: 4px`, `s: 8px`, `m: 16px`, `l: 24px`, `xl: 32px`). Interactive controls and surfaces share three aligned size tiers:

| Tier | Control Height | Horizontal Padding | Gap | Icon Size | Surface Padding / Gap |
| --- | --- | --- | --- | --- | --- |
| **`s`** | `30px` | `10px` (`12px` on `Button` in `Soft`/`Frost`) | `6px` | `14px` | `12px` / `8px` |
| **`m`** | `40px` | `16px` | `8px` | `16px` | `16px` / `12px` |
| **`l`** | `48px` | `20px` | `10px` | `20px` | `24px` / `16px` |

Buttons, inputs, selects, date pickers, and segmented controls of the same `size` share exact pixel heights in horizontal toolbars, while standalone `Avatar` frames use `32px / 40px / 48px` across `s / m / l` (plus compact `24px` `xs` and `20px` `2xs` inline sizes). `Pixel` calibrates `JetBrains Mono` (`14/12/11` body/caption) to match the line boxes and horizontal rhythm of `Inter` (`16/14/12`) in `Soft` and `Frost`.

## Responsive Layout Primitives

Structural layout composes through `AppShell`, `Box`, `Flex`, `Stack`, `Grid` (`GridItem`), and `Container` (`s: 720px`, `m: 960px`, `l: 1280px`) across mobile-first CSS breakpoints (`mobile: 0px`, `tablet: 768px`, `desktop: 1024px`, `wide: 1440px`):

```tsx
<Container size="l">
  <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap={{ mobile: 's', desktop: 'm' }}>
    <Card>Overview</Card>
    <Card>Throughput</Card>
    <Card>Incidents</Card>
  </Grid>
</Container>
```

Responsive props compile to CSS custom properties and media queries with zero `matchMedia` hydration jitter. Primitives declare root `display` at zero specificity (`:where(...)`) and preserve native `[hidden]` semantics regardless of stylesheet import order.
