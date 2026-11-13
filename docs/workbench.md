# Workbench Workflow

The playground renders live React specimens in Soft, Frost, and Pixel, each in Dark and Light. A component prototype establishes its visual roles and product fit before the library implementation. Prototype code is local to the playground and is not exported from `@docouno/unica`.

## Author a Specimen

Keep each family under `apps/playground/src/prototypes/<family>/`:

- `<family>.proto.tsx`: a small native React visual prototype.
- `<family>.css`: component styles consuming semantic tokens.
- `<family>.specimen.tsx`: the default export of `defineSpecimen(...)`.
- Optional example helpers and styles: presentation and product vignettes for review.

Import `defineSpecimen` from `../../workbench/types.js`. Give the specimen a unique `id`, `title`, `group`, and `sections`. Each section has a unique `id`, `title`, `kind`, and `render` function:

```tsx
export default defineSpecimen({
  id: 'family',
  title: 'Family',
  group: 'Foundations',
  sections: [
    { id: 'roles', title: 'Roles', kind: 'matrix', render: RoleExamples },
    { id: 'overflow', title: 'Overflow', kind: 'states', render: OverflowExamples },
    { id: 'context', title: 'Folio context', kind: 'context', render: ProductVignette },
  ],
});
```

`RoleExamples`, `OverflowExamples`, and `ProductVignette` are local example render functions. The files are discovered automatically; no registry edit is needed. Text and Title provide working examples.

Use `matrix` for supported roles and sizes, `states` for relevant states and long content, and `context` for a compact product vignette from [Folio](compositions/folio.md). A family task needs its relevant vignettes; it does not need to recreate all ten full screens. Full compositions live in `src/scenes/<NN>-<slug>.scene.tsx` and default-export `defineScene(...)` from the same types module.

Set `surface: 'overlay'` and `overlayStage: true` for a floating context. The workbench provides a product underlay and overlay context; the prototype paints its own panel with `--bg-overlay`, `--overlay-backdrop`, and the appropriate border, radius, and shadow tokens.

## Inspect and Render

```sh
make setup
make build package=ui
make up app=playground headless=1
make status
```

Open the reported URL with `/?item=text` or `/?item=title`. Each worktree receives its own host port. Use `6-up Matrix` to compare presets and `Live Focus` to inspect at full size. Check Auto/Base/Overlay surfaces, 360/768/1280/1440px containers, 120% Text, and RTL.

```sh
make visual item=text section=scale out=text-scale.png
make visual item=title section=modal mode=focus theme=frost-dark vp=1280 out=title-modal.png
make visual item=title section=wrapping mode=focus theme=pixel-light vp=360 scale=120 dir=rtl out=title-stress.png
```

`make visual` prepares its renderer and library build, then captures an offline Chromium screenshot at 2× resolution. Files go to Git-ignored `.artifacts/visual/`. `raw=0` includes the workbench controls; the default captures artboards. Keep other temporary evidence in `.artifacts/<task>/` inside the checkout. Stop the preview with `make down` when it is no longer needed.

## Boundaries and Handoff

Prototype styles use semantic CSS custom properties. Do not branch on theme names or hardcode color literals. Component tasks do not modify the portable `src/workbench/` shell or library tokens. Report a missing token or migration defect separately before changing the foundation.

Prototype native text wrapping and visible states honestly in the browser. Full focus management, ARIA coordination, form participation, and the public TypeScript contract belong to library implementation. Native stand-ins for adjacent unfinished families should be identified in the specimen.

After visual approval, implement the family in `packages/ui` in a separate change. Switch the specimen and scene imports to `@docouno/unica`, remove the temporary prototype and its component CSS, and retain only example layout styles. Add `docs/components/<family>.md` with the public contract. Run the repository checks, tests, build, package verification, and visual inspection before handoff.
