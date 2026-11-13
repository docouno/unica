# Unica UI

`@docouno/unica` is a role-based React 19+ design system: accessible components, responsive layout primitives, semantic tokens, and multi-material themes in a single pure-ESM TypeScript package.

Components expose semantic roles rather than decorative material props. Switching themes reconfigures surface physics, corner geometry, elevation, and typography across the application without changing component JSX.

## Themes

Every launch theme ships in calibrated `Dark` and `Light` presets (`6` presets total):

- **Soft (`soft-dark`, `soft-light`)** — Warm editorial matte surfaces, cream-vellum and slate contrast, borderless pastel accents, and opaque floating layers.
- **Frost (`frost-dark`, `frost-light`)** — Obsidian and alabaster neutrals, electric indigo-violet accents, volumetric primary CTAs with tactile `0 2px 0` keycap ledges, and frosted glass overlays.
- **Pixel (`pixel-dark`, `pixel-light`)** — Sharp `0px` orthogonal geometry (preserving circular `Radio` indicators), `JetBrains Mono` typography, `1px` structural borders, corner registration ticks, and crisp offset block shadows.

## Quick Example

```tsx
import '@docouno/unica/styles.css';
import { THEME_PRESETS } from '@docouno/unica';

export function ThemePreview() {
  return (
    <div data-theme="frost-dark" style={{
      background: 'var(--bg-canvas)',
      color: 'var(--fg-primary)',
      padding: 'var(--space-24)',
    }}>
      {THEME_PRESETS.find((preset) => preset.id === 'frost-dark')?.label}
    </div>
  );
}
```

The library currently provides theme tokens, preset metadata, and a starter Button. New component families are reviewed as live prototypes in the playground before their public package APIs ship. Architectural documents describe the target component contracts.

## Repository Structure

```text
unica/
├── Makefile
├── compose.yaml
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
| `make setup` | Prepare pinned container images and workspace dependencies |
| `make check` | Run formatting, lint, `isolatedDeclarations` typecheck, and gates |
| `make fix` | Apply formatting and lint autofixes |
| `make test` | Run unit and component test suites |
| `make build` | Build `packages/ui` and `apps/playground` |
| `make package` | Pack `@docouno/unica` and verify ESM/TypeScript exports |
| `make dev app=playground` | Start the interactive 6-preset Vite workbench |
| `make visual` | Render deterministic `2x` PNG screenshots into `.artifacts/visual/` |
| `make status` / `make down` | Show active ports or stop running services |

## Documentation

- [Documentation Index](docs/README.md) — themes, geometry, overlays, forms, and browser support
- [Workbench Workflow](docs/workbench.md) — author prototypes, inspect six presets, and render screenshots
- [Folio Composition](docs/compositions/folio.md) — baseline product scenes across `Soft`, `Frost`, and `Pixel`
- [Contributor & Agent Guide](AGENTS.md) — architectural invariants and verification workflow
- [Devkit Runtime Guide](.devkit/runtime/GUIDE.md) — container toolchain, dependency workflows, and packaging

## License

Released under the MIT License.
