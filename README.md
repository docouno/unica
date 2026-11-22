# Unica UI

`@docouno/unica` is a role-based design system for React 19. Its pure-ESM TypeScript package includes semantic tokens, multi-material themes, and shared foundations for accessible components and responsive layout primitives.

Components expose semantic roles rather than decorative material props. Switching themes reconfigures surface physics, corner geometry, elevation, and typography across the application without changing component JSX.

## Themes

Every launch theme ships in calibrated `Dark` and `Light` presets (`6` presets total):

- **Soft (`soft-dark`, `soft-light`)** — Warm editorial matte surfaces, cream-vellum and slate contrast, borderless pastel accents, and opaque floating layers.
- **Frost (`frost-dark`, `frost-light`)** — Obsidian and alabaster neutrals, electric indigo-violet accents, deep violet primary CTAs with diagonal color volume and diffuse ambient light, and frosted glass overlays.
- **Pixel (`pixel-dark`, `pixel-light`)** — Sharp `0px` orthogonal geometry (preserving circular `Radio` indicators), `JetBrains Mono` typography, `1px` structural borders, corner registration ticks, and crisp offset block shadows.

## Quick Example

```tsx
import '@docouno/unica/styles.css';
import { THEME_PRESETS, UnicaProvider, getUnicaRootProps, type ThemeConfig } from '@docouno/unica';

const theme = { preset: 'frost-dark' } satisfies ThemeConfig;

export function ThemePreview() {
  return (
    <UnicaProvider theme={theme}>
      <div
        {...getUnicaRootProps({ theme })}
        style={{
          background: 'var(--bg-canvas)',
          color: 'var(--fg-primary)',
          padding: 'var(--space-24)',
        }}
      >
        {THEME_PRESETS.find((preset) => preset.id === theme.preset)?.label}
      </div>
    </UnicaProvider>
  );
}
```

The library ships theme tokens, preset metadata, `getUnicaRootProps`, `UnicaProvider`, [Layout](docs/components/layout.md) primitives (including `VisuallyHidden`), [native scrollbar utilities](docs/components/scrollbar.md), the [Icon](docs/components/icon.md) glyph protocol, [Link](docs/components/link.md), [Tooltip](docs/components/tooltip.md), [HoverCard](docs/components/hover-card.md), [Portal](docs/components/portal.md), [Badge](docs/components/badge.md), [Divider](docs/components/divider.md), [Indicator](docs/components/indicator.md), [Input](docs/components/input.md), the typography primitives [Text](docs/components/text.md), [Title](docs/components/title.md), [Code](docs/components/code.md) and [Blockquote](docs/components/blockquote.md), keyboard hints [Kbd and KbdGroup](docs/components/kbd.md), [Spinner](docs/components/spinner.md), [Progress and ProgressCircle](docs/components/progress.md), and [Skeleton and SkeletonText](docs/components/skeleton.md). The `data-theme` attribute (or `getUnicaRootProps`) applies the CSS preset. `UnicaProvider` supplies [structural component defaults](docs/concepts/themes-and-roles.md#structural-component-defaults), scoped `portalContainer`, and `iconAdapter` through React context.

New component families are reviewed as live prototypes in the playground before their public package APIs ship. Playground scenes use shipped components alongside families still in design.

The [Workbench](docs/workbench.md) has Playground, Matrix, Cases, and Usage views for each component. Choose Family and Scheme to compare themes or isolate one artboard, then inspect actual component bounds and interactions at different widths, text scales, and reading directions.

The playground also includes ten [Folio scenes](docs/compositions/folio.md) assembled from shared components and visual prototypes. Open `/?item=02-workspace-overview` for the workspace, `/?item=05-rich-editor` for the editor, or `/?item=09-user-preferences` for settings. Component Usage views link to scenes that render the component. Scene interactions update local preview state.

## Repository Structure

```text
unica/
├── .config/wt.toml    # Worktrunk hooks for sticky stand reservation and cleanup
├── Makefile
├── pnpm-workspace.yaml
├── packages/
│   └── ui/            # @docouno/unica library source, CSS tokens, and themes
├── apps/
│   └── playground/    # 6-preset Vite workbench, component specimens, and live scenes
└── docs/              # Architecture concepts, compositions, and component contracts
```

## Development

Requires Linux x86_64, Docker Engine with Docker Compose 5.0.0+, and GNU Make. Toolchains execute in pinned [`@docouno/devkit`](https://github.com/docouno/devkit) containers:

```sh
make setup
make check
make dev app=playground
```

| Command | Purpose |
| --- | --- |
| `make setup` | Prepare pinned container images and pnpm workspace dependencies |
| `make doctor` | Verify accepted images, workspace receipts, disk space, and invariants |
| `make sync [reconcile=1] [preview=1]` | Synchronize workspace projections and `pnpm-lock.yaml` after manifest edits |
| `make check` | Run formatting, lint, `isolatedDeclarations` typecheck, and gates |
| `make fix` | Apply formatting and lint autofixes |
| `make test` | Run unit and component test suites |
| `make visual-setup` | Prepare the shared container image, dependencies, and Chromium cache |
| `make test-browser` | Run real-browser contract tests against UI source in offline Chromium |
| `make build` | Build `packages/ui` and `apps/playground` |
| `make package` | Pack `@docouno/unica` and verify ESM/TypeScript exports |
| `make dev app=playground` / `make up app=playground headless=1` | Start the interactive 6-preset Vite workbench with per-checkout sticky host ports |
| `make info [json=1]` | Show checkout readiness, running services, and preview addresses |
| `make down [cleanup=1]` | Stop services (keep port leases by default; pass `cleanup=1` to release them) |
| `make visual` | Render deterministic `2x` PNG screenshots into `.artifacts/visual/` |

## Documentation

- [Documentation Index](docs/README.md) — themes, geometry, feedback, overlays, forms, and browser support
- [Component Anatomy](docs/anatomy.md) — family structure, master axis dictionaries, and conformance gates
- [Workbench Workflow](docs/workbench.md) — author specimens, compare themes, and capture a specific view
- [Browser Tests](docs/browser-tests.md) — prepare Chromium and add a browser contract scenario
- [Folio Composition](docs/compositions/folio.md) — baseline product scenes across `Soft`, `Frost`, and `Pixel`
- [Contributor & Agent Guide](AGENTS.md) — architectural invariants and verification workflow
- [Devkit Runtime Guide](.devkit/runtime/GUIDE.md) — container toolchain, dependency workflows, and packaging

## License

Released under the MIT License.
