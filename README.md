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
import { Button, Card, Input, Stack } from '@docouno/unica';

export function SignInCard() {
  return (
    <div data-theme="frost-dark">
      <Card variant="default">
        <form>
          <Stack gap="m">
            <Input name="email" type="email" placeholder="you@example.com" required />
            <Button type="submit" variant="primary" tone="accent">Continue</Button>
          </Stack>
        </form>
      </Card>
    </div>
  );
}
```

## Repository Structure

```text
unica/
├── Makefile
├── compose.yaml
├── packages/
│   └── ui/            # @docouno/unica library source, CSS tokens, and themes
├── apps/
│   └── playground/    # Interactive Vite workbench and live compositions across all 6 presets
├── designs/           # Upfront pen.dev prototypes, shaders, and compositions (starting with Folio)
└── docs/              # Architecture concepts and component contracts
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
| `make dev app=playground` | Start the interactive Vite playground |
| `make status` / `make down` | Show active ports or stop running services |

## Documentation

- [Documentation Index](docs/README.md) — themes, geometry, overlays, forms, and browser support
- [Design Prototypes](designs/README.md) — `unica.lib.pen` library and visual compositions (starting with **Folio**)
- [Contributor & Agent Guide](AGENTS.md) — architectural invariants and verification workflow
- [Devkit Runtime Guide](.devkit/runtime/GUIDE.md) — container toolchain, dependency workflows, and packaging

## License

Released under the MIT License.
