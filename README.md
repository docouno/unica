# Unica UI

`@docouno/unica` is a role-based React 19+ design system: accessible components, responsive layout primitives, semantic tokens, and multi-material themes in a single pure-ESM TypeScript package.

Components expose semantic roles rather than decorative material props. Switching themes reconfigures surface physics, corner geometry, elevation, and typography across the application without changing component JSX.

## Themes

Every launch theme ships in calibrated `Dark` and `Light` presets (`6` presets total):

- **Soft (`soft-dark`, `soft-light`)** — Warm editorial matte surfaces, cream-vellum and slate contrast, borderless pastel accents, and opaque floating layers.
- **Frost (`frost-dark`, `frost-light`)** — Obsidian and alabaster neutrals, electric indigo-violet accents, deep violet primary CTAs with diagonal color volume and diffuse ambient light, and frosted glass overlays.
- **Pixel (`pixel-dark`, `pixel-light`)** — Sharp `0px` orthogonal geometry (preserving circular `Radio` indicators), `JetBrains Mono` typography, `1px` structural borders, corner registration ticks, and crisp offset block shadows.

## Quick Example

```tsx
import '@docouno/unica/styles.css';
import { THEME_PRESETS, UnicaProvider, type ThemeConfig } from '@docouno/unica';

const theme = { preset: 'frost-dark' } satisfies ThemeConfig;

export function ThemePreview() {
  return (
    <UnicaProvider theme={theme}>
      <div
        data-theme={theme.preset}
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

The library currently ships theme tokens, preset metadata, `UnicaProvider`, and native scrollbar utilities. The `data-theme` attribute applies the CSS preset, and the provider supplies structural component defaults through React context. See [Structural Component Defaults](docs/concepts/themes-and-roles.md#structural-component-defaults) and [Native Scrollbars](docs/concepts/scrollbars.md).

New component families are reviewed as live prototypes in the playground before their public package APIs ship.

The playground includes all ten [Folio product scenes](docs/compositions/folio.md), assembled from shared visual prototypes. Open `/?item=02-workspace-overview` for the workspace, `/?item=05-rich-editor` for the editor, or `/?item=09-user-preferences` for settings. Inspect them in the six-preset matrix or Live Focus, then use the viewport, text-scale, and direction controls to check the same composition under stress. Scene interactions update local preview state; the prototypes are separate from the package's public API.

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
| `make build` | Build `packages/ui` and `apps/playground` |
| `make package` | Pack `@docouno/unica` and verify ESM/TypeScript exports |
| `make dev app=playground` / `make up app=playground headless=1` | Start the interactive 6-preset Vite workbench with per-checkout sticky host ports |
| `make info [json=1]` | Show checkout readiness, running services, and preview addresses |
| `make down [cleanup=1]` | Stop services (keep port leases by default; pass `cleanup=1` to release them) |
| `make visual` | Render deterministic `2x` PNG screenshots into `.artifacts/visual/` |

## Documentation

- [Documentation Index](docs/README.md) — themes, geometry, overlays, forms, and browser support
- [Workbench Workflow](docs/workbench.md) — author prototypes, inspect six presets, and render screenshots
- [Folio Composition](docs/compositions/folio.md) — baseline product scenes across `Soft`, `Frost`, and `Pixel`
- [Contributor & Agent Guide](AGENTS.md) — architectural invariants and verification workflow
- [Devkit Runtime Guide](.devkit/runtime/GUIDE.md) — container toolchain, dependency workflows, and packaging

## License

Released under the MIT License.
