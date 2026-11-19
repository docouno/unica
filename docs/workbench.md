# Workbench Workflow

The playground renders live React specimens in Soft, Frost, and Pixel, each in Dark and Light. Design work establishes a family's appearance and intended interaction before library implementation. Prototype code is local to the playground and is not exported from `@docouno/unica`.

## Design Outcome and Prototype Behavior

Design defines the agreed component scope: anatomy, roles, sizes, slots, states and relevant combinations, transitions, response to input, and product fit. Include the intended accessible experience: focus treatment, keyboard outcomes, unavailable states, and feedback. The handoff must describe and demonstrate these decisions well enough that implementation does not have to invent visual or interaction behavior within that scope.

React, HTML, and CSS are tools for evaluating the design in the browser. Implement the behavior needed to answer concrete design questions, using native controls and semantics where useful. A real input, native dialog, local state, or pointer handler can make a preview more informative. Controlled previews may expose states without a complete interaction engine; distinguish pinned states from working interactions. Keep the prototype usable for review and identify its limits.

The prototype's implementation is disposable. Its props, helpers, and DOM structure are not the final library API or architecture. This limits implementation obligations, not the depth or quality of design exploration.

| Stage | Result | Verification |
| --- | --- | --- |
| Design | A detailed visual and interaction specification with a live reference. Product and accessibility outcomes are decided; implementation mechanisms may remain open. | Inspect actual renders, relevant interactions, material coherence, readability, geometry, and existing consumer fit. Repository checks protect the preview; visual approval accepts the design. |
| Library implementation | A production component in `packages/ui` that preserves the approved experience. | Prove the public TypeScript API and complete DOM, ARIA, keyboard, focus, state, and form contracts with appropriate tests and package checks. |

Select cases and probes for the design questions or regressions they can expose. Measurements such as contrast support inspection of the actual result; passing a number or a test does not establish design quality. Full library contract coverage is not a prerequisite for a design review.

## Author a Specimen

Keep each family under `apps/playground/src/prototypes/<family>/`:

- `<family>.proto.tsx`: a small native React visual prototype.
- `<family>.css`: component styles consuming semantic tokens.
- `<family>.specimen.tsx`: the default export of `defineSpecimen(...)`.
- Optional example helpers and styles: isolated usage examples and specimen controls.

Import `defineSpecimen` from `../../workbench/types.js`. Give the specimen a unique `id`, `title`, `group`, and `sections`. Each section has a unique `id`, `title`, `kind`, and `render` function:

```tsx
export default defineSpecimen({
  id: 'family',
  title: 'Family',
  group: 'Foundations',
  sections: [
    { id: 'roles', title: 'Roles', kind: 'matrix', render: () => <RoleExamples /> },
    { id: 'overflow', title: 'Overflow', kind: 'states', render: () => <OverflowExamples /> },
    { id: 'usage', title: 'Action pair', kind: 'context', render: () => <ActionPair /> },
  ],
});
```

`RoleExamples`, `OverflowExamples`, and `ActionPair` are local React components. Render callbacks return their JSX elements so hooks belong to the example component when the selected item or section changes. Keep hooks inside components, and use instance-specific native radio group names because all six artboards share one document. The files are discovered automatically; no registry edit is needed. Text and Title provide working examples.

Use `matrix` for supported roles and sizes and `states` for relevant states and long content. An optional `context` section may show a small, product-independent arrangement when it resolves a component question, such as adjacent actions or icon alignment. Do not reproduce application-specific screens, dialogs, or workflows inside each component specimen. A family still shows its own anatomy and the minimal neighboring content needed to evaluate it.

Application compositions live independently in `src/scenes/<NN>-<slug>.scene.tsx` and default-export `defineScene(...)`. They consume shared components: **compositions → components**. [Folio](compositions/folio.md) is one example application, not the source of component requirements or a mandatory specimen checklist. New applications and compositions do not require new cases in every component specimen. Verify product fit in the existing scene consumers.

Set `surface: 'overlay'` and `overlayStage: true` for a floating context. The workbench provides an underlay and inherited overlay context. A floating-surface family paints its own panel with `--bg-overlay`, `--overlay-backdrop`, and the appropriate border, radius, and shadow tokens. An isolated nested control does not gain a panel from the surface override; inspect its actual placement in a relevant consumer without copying that application into its specimen.

## Inspect and Render

```sh
make setup
make up app=playground headless=1
make info
```

Open the reported URL with `/?item=text` or `/?item=title`. Each checkout leases its own sticky loopback port (`make up` builds `packages/ui` automatically before starting the dev server, and Vite serves library source changes via HMR). Loopback preview works out of the box; to route through an HTTP(S) reverse proxy, set `DEVKIT_PREVIEW_URL_TEMPLATE` (using `{port}`, `{service}`, `{branch}`/`{slug}`) in the process environment or a Git-ignored root `.env` file, and confirm the active address with `make info`. Use `6-up Matrix` to compare presets and `Live Focus` to inspect at full size. Check Auto/Base/Overlay surfaces, 360/768/1280/1440px containers, 120% Text, and RTL.

```sh
make visual item=text section=scale out=text-scale.png
make visual item=title section=modal mode=focus theme=frost-dark vp=1280 out=title-modal.png
make visual item=title section=wrapping mode=focus theme=pixel-light vp=360 scale=120 dir=rtl out=title-stress.png
```

`make visual` validates accepted inputs and receipts through `make doctor`, then verifies real pnpm resolution for the renderer entry points and the local `@docouno/unica` workspace link (`scripts/visual-ready.mjs`) without requiring `packages/ui/dist`. Missing workspace dependencies or headless Chromium are prepared automatically; prepared checkouts reuse their environment without reinstalling dependencies or browsers. If the post-setup probe still fails (for example, when missing files or symlinks inside `node_modules` are skipped by pnpm's `optimistic-repeat-install`), `visual-setup` exits loudly with manual recovery instructions instead of deleting `node_modules`. Vite resolves library exports directly to source, so screenshots need no library build and include current source edits. Dependency or environment changes remain subject to Devkit validation; follow its `make sync` or `make setup` guidance if required. The capture itself runs offline at 2× resolution. Run repository checks for the affected code and dependencies as described in [Definition of Done](../AGENTS.md#definition-of-done); screenshots and package checks establish different things.

Captures keep Chromium's native inner scrollbars visible. The renderer paints the full document without clipping the root frame, then captures it directly: Chromium's usual full-page path hides scrollbars and changes their occupied space. The 900px layout viewport and viewport-relative units remain unchanged. The outer document scrollbar is omitted; inspect that scrollbar in the live browser. Inner overflow and classic scrollbar geometry remain visible as a platform sample, not a promise of identical macOS or touch rendering.

Files go to Git-ignored `.artifacts/visual/`. `raw=0` includes the workbench controls; the default captures artboards. Keep other temporary evidence in `.artifacts/<task>/` inside the checkout. Stop the preview with `make down` (keeping its sticky port lease) or `make down cleanup=1` to release the lease when it is no longer needed. When managing parallel worktrees with [Worktrunk](https://worktrunk.dev/), `.config/wt.toml` hooks reserve ports on creation and clean up stand resources before removal (pass `--yes` in non-interactive sessions or run `wt config approvals add --yes` once).

## Boundaries and Handoff

Prototype styles use semantic CSS custom properties. Do not branch on theme names or hardcode color literals. The portable `src/workbench/` shell and production component implementation stay outside ordinary design tasks. If a demonstrated material defect or missing recipe prevents the intended design, address it explicitly at the theme-token source, assess affected consumers, and verify the change and documentation. A bounded theme repair does not make the library component part of the design task.

Use the system's structural roles and established vocabulary when describing the design. Illustrative JSX and prototype controls help explain anatomy and use; exact TypeScript signatures, internal state architecture, and complete reusable focus/form/ARIA mechanisms are resolved during library implementation. Record expected user outcomes separately from mechanisms not yet implemented. Identify native stand-ins for adjacent unfinished families.

After visual approval, implement the family in `packages/ui` in a separate change. Engineering choices may change the prototype's internal structure while preserving approved appearance and interaction. Resolve a new product or visual conflict explicitly rather than silently redesigning it or treating prototype helpers as a fixed API. Switch the specimen and scene imports to `@docouno/unica`, remove the temporary prototype and its component CSS, and retain only example layout styles. Add `docs/components/<family>.md` with the public contract. Run the repository checks, tests, build, package verification, and visual inspection before handoff.
