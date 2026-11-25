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

## Inspect Components and Scenes

```sh
make setup
make up app=playground headless=1
make info
```

Open the reported URL. Expand or collapse categories using their heading buttons. Scene collections are nested under **Scenes**. Search the catalog by name, ID, or category with `/` or `Ctrl+K` (`Cmd+K` on macOS). Search reveals matching groups while keeping the regular catalog expansion choices. Filter component entries by `Proto` for visual prototypes or `UI` for shipped families. The desktop catalog keeps its width as groups expand, and the catalog, preview, and inspection panes share a compact scrollbar.

Preview sections (`StoryFrame`) pair a heading, caption, and optional frame toolbar (`controls`, `actions`, `reset`) above independent per-theme preview windows. Each theme artboard renders inside its own isolated window matched to that preset's light or dark scheme, with a compact expand/collapse icon button in the right corner of the window header. Expanding a window focuses that case and theme (`solo=<themeId>`) while temporarily clearing active selection on the top Family/Scheme filters; collapsing it (or pressing `Escape`, or browser Back) restores the previous filter and section view in one step. When only light themes are visible (outside **Usage**), the content canvas switches to a neutral light backdrop so light theme windows sit naturally with subtle shadows while the outer Workbench shell remains dark. **States** shows generated grids alongside the standalone studies declared in `cases`. Full scenes render their artboards directly, or wrap them in a shared `StoryFrame` when the scene declares frame controls, actions, or `reset`. **Reset scene** restores the initial state of the scene and its frame controls across the selected themes while keeping the current view settings and URL.

Unica supplies one [Portal](components/portal.md) host per physical artboard. Scene content and inspector previews in the same artboard share its host. Portaled content inherits the artboard's theme, text scale, and direction. A native modal still applies to the whole document, and locally scoped notification viewports follow modals within their own artboard. Inspect exact anchored popover geometry in an isolated single theme rather than zoomed multi-theme comparisons, where scaled artboards and unscaled top-layer surfaces use different coordinate scales.

Component views are declared via `WorkbenchConfig.componentTabs` (keeping `src/workbench/` portable without library coupling). Every Unica component exposes four non-overlapping views.

| View | What to inspect |
| --- | --- |
| Playground | Isolated single subject. Change component properties in one place and compare the resulting subjects across themes. Review formatted, syntax-highlighted, copyable JSX and any events supplied by the example. The event log keeps the latest 100 entries and reports how many earlier entries it omitted. Form examples record native submit and reset events and show the submitted FormData. Keep compositions out of Playground. |
| States | Single scrollable review surface consolidating all orthogonal state slices (`Roles × Tones`, `Sizes`, `States`, `Slots & Overflow`, `Base vs Overlay`) and edge cases in `StoryFrame` blocks. Multi-theme rendering stays responsive via `IntersectionObserver` and `content-visibility: auto` (all sections mount eagerly under `freeze=1`, `raw=1`, or single-section filtering). Switch to **Combinator** in the right Inspector for custom `Rows × Columns × Group` axes, **Pairwise** coverage audits, or bounded **Full** grids. |
| Compositions | Local examples pairing the component with frequent neighbors inside `StoryFrame`, each with formatted, copyable JSX. Application screens live in Scenes. |
| Usage | Standardized documentation assembled from a single source of truth via `WorkbenchConfig.docs`: Quick Start + `import` snippet, auto-generated **Props & constraints** table from `defineComponent(...)`, auto-loaded Markdown from `docs/components/<family>.md` (`UI`) or `apps/playground/src/prototypes/<family>/README.md` (`Proto`), and **Consuming scenes** links at the bottom. Browser Back returns from a scene to Usage. |

The full-height **Inspector** on the right holds the settings for the current view and the live **Theme** editor. Preview settings stay in the header above the canvas:

- **Playground:** Controls, Events, and FormData tabs share the panel with copyable live JSX. The selected tab and JSX scroll independently.
- **States:** Switch between **Overview** (section table of contents with jump-to-section links and global slice filters) and **Combinator** (slice selector, `Rows`/`Columns`/`Group` axes, `Slice` / `Pairwise` / `Full` modes, and global values).
- **Compositions:** Filter to a single composition or view all compositions together.
- **Usage:** Jump to Quick Start, Props & constraints, loaded documentation headings, or Consuming scenes via **On this page**.
- **Scenes:** Opens directly to the **Theme** editor alongside **Reset scene**. On components, switch between **Inspector** and **Theme** in the panel toolbar. On narrow screens, **Inspector** opens the same panel over the right edge of the preview.

The **Theme** editor is configured declaratively via `WorkbenchConfig.themeEditor` (keeping `src/workbench/` portable without library imports). It pairs OKLCH macro controls (`Neutral Hue`, `Neutral Chroma`, `Canvas Lightness`, `Layer Contrast`, `Accent Color`, and `Corner Geometry`) with searchable groups of individual color, spacing, radius, and typography tokens, plus a live WCAG 2.1 contrast readout. Manual token edits override macro-derived values without being overwritten by other macro changes. Overrides are injected via a single scoped stylesheet on `.wb-shell .wb-artboard[data-theme="..."]`, persisted in `localStorage`, and exportable as a CSS diff via **Copy CSS** / **View CSS**. Captures (`raw=1` and `make visual`) ignore persisted theme editor overrides so visual diffs stay deterministic.

In **Combinator**, selecting an axis releases any global value for that property, and fixing a property removes it from the free axes. Large Slice and Pairwise views load more rows as you scroll. Isolating a theme keeps its revealed rows. Adding a theme starts the comparison at its first batch. The **Show more rows** button also supports keyboard navigation. Frozen captures include the entire result. Pairwise covers every pair of finite values that has a valid completion under the current fixed values. Full shows every combination, including N/A cells, while the total across selected themes fits in 64 displayed cells.

Choose Family and Scheme independently. All × Both compares all available presets. Select one family and one scheme, or click the expand icon in an artboard header, to inspect a single theme at natural size. Change Surface, Width, 120% Text, and RTL to stress the selected example. A fixed width applies to the frame and its viewport. The surrounding layout keeps the full grid track available. Frames in the Playground share the available height. At a fixed width, each row fits as many frames as the available space allows. When both schemes are selected, each family keeps its dark and light previews together. Comparisons scale down when needed in browsers with CSS zoom. Wider frames in focus mode and comparison frames on other browsers can be scrolled horizontally. Bounds measures authored subjects in CSS pixels. Use browser Back and Forward to revisit item, tab, and theme selections.

The page heading shows the item name and, for components, the implementation status. The theme canvas is applied to the live sample. Matrix coordinates, frame toolbars, and review notes use Workbench typography, and States and Compositions show each heading and caption once above the theme comparison.

The Workbench owns a grayscale palette and compact recipes for fields, segments, buttons, and navigation. Those styles and the font assets load with the shell. Changing a preview theme changes the examples while the inspection controls keep their appearance. Workbench fields change the border on focus and show a separate outline during keyboard navigation. Select fields use the system menu on browsers without customizable native pickers.

Each checkout leases a sticky loopback port. `make up` builds the playground's dependencies before starting Vite, which serves library source changes via HMR. For reverse-proxied preview, set `DEVKIT_PREVIEW_URL_TEMPLATE` with the desired URL and placeholders (`{port}`, `{service}`, `{branch}` or `{slug}`) in the environment or a Git-ignored root `.env` file. Confirm the address with `make info`.

## Author a Specimen

Place each catalog entry under `apps/playground/src/specimens/<family>/*.spec.tsx` and default-export `defineComponent` from `../../workbench/types.js`. The playground discovers these files automatically. Keep design-only component implementations and their semantic CSS under `src/prototypes/<family>/`. Every `Proto` family must also include a `src/prototypes/<family>/README.md` design handoff (loaded by the Usage tab and enforced by `unica.contract.test.tsx`); shipped `UI` families load `docs/components/<family>.md`. Put reusable example helpers next to the family or its specimen.

Use a stable `id`, a `title`, a catalog `category`, and a `status`. The same props drive Playground controls, States slices, Combinator, and the auto-generated **Props & constraints** table in Usage.

### Declarative `component` Shortcut

For straightforward components that accept standard props directly, pass `component` instead of writing manual `render` and `code` boilerplate. Workbench spreads `ctx.subject`, wires `action` props via `ctx.action(...)`, maps `slot` props via optional `slotRenderers`, passes `children` (or `defaultChildren`), and formats idiomatic JSX automatically.

```tsx
import { Badge } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';

export default defineComponent({
  id: 'badge',
  title: 'Badge',
  category: 'Feedback & Status',
  status: 'UI',
  component: Badge,
  props: {
    status: {
      kind: 'enum',
      group: 'Role',
      default: 'neutral',
      description: 'Semantic status tone.',
      choices: [{ value: 'neutral' }, { value: 'accent' }, { value: 'success' }],
    },
    dot: {
      kind: 'boolean',
      group: 'Content',
      default: false,
      description: 'Show a leading status dot.',
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: 'Verified',
      description: 'Visible badge label.',
    },
  },
  states: [{ id: 'status', title: 'Statuses', rows: 'status', cols: 'dot' }],
});
```

Use custom `render` and `code` functions when the subject needs compound children, local controlled/uncontrolled state, or custom host wiring.

```tsx
import { Title } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';

export default defineComponent({
  id: 'article-title',
  title: 'Article title',
  category: 'Typography',
  status: 'UI',
  componentName: 'Title',
  props: {
    truncate: {
      kind: 'boolean',
      group: 'Overflow',
      default: false,
      description: 'Use a single line and truncate the remaining text.',
    },
    lineClamp: {
      kind: 'number',
      group: 'Overflow',
      default: 0,
      examples: [0, 2],
      description: 'Limit the number of lines. Zero leaves the line count unrestricted.',
    },
  },
  constraints: [
    {
      kind: 'precedence',
      when: { lineClamp: 2 },
      affects: [{ key: 'truncate', value: true }],
      reason: 'A two-line clamp takes precedence over single-line truncation.',
    },
  ],
  states: [{ id: 'overflow', title: 'Line limits', rows: 'lineClamp', cols: 'truncate' }],
  code: ({ truncate, lineClamp }) =>
    `<Title${truncate ? ' truncate' : ''}${lineClamp ? ` lineClamp={${lineClamp}}` : ''}>Release notes for the document editor</Title>`,
  render: ({ values, ctx }) => (
    <Title {...ctx.subject} truncate={values.truncate} lineClamp={values.lineClamp}>
      Release notes for the document editor
    </Title>
  ),
});
```

### Standard `StoryFrame` Controls and Actions

**Never place ad-hoc native `<select>` pickers, demo checkboxes, state-cycle buttons, or local Reset buttons inside component artboards.** Declare frame-level `controls`, `actions`, and `reset: true` on any state slice (`states`), case (`cases`), composition (`compositions`), or scene (`defineScene`). Authentic interactive UI that belongs to the composition itself (such as a form's own `<Button type="reset">` or a transfer row's Pause/Cancel buttons) stays inside the preview; test-harness controls belong exclusively in the frame toolbar.

- **`controls` (persistent state synced across all mounted and newly revealed themes):**
  - `{ kind: 'boolean', label, default }`
  - `{ kind: 'enum', label, choices: (string | { value, label? })[], default }`
  - `{ kind: 'number', label, default, min?, max?, step? }` (numeric inputs clamp to `min`/`max` and commit on valid input or blur)
  - Read `ctx.story?.controls` to render the current settings. When an interaction changes a shared setting, call `ctx.story?.setControl(key, value)` from the handler. For example, a save that consumes a simulated failure can call `ctx.story?.setControl('failNext', false)` to clear the checkbox for every theme. The frame accepts declared boolean values, enum choices and finite numbers. It clamps numeric writes to the configured bounds and clears any pending draft for that control. Repeating the same value preserves the shared controls object.
- **`actions` (imperative one-shot triggers broadcast to mounted artboards):**
  - `{ id, label }` — always subscribe with `useStoryAction(ctx, (actionId) => ...)` rather than reading `ctx.story.lastAction` in an effect.
- **`reset: true`:**
  - Restores all declared `controls` to their defaults and remounts every visible artboard in that frame while keeping focus on the Reset button and preserving the URL. Never add a manual `{ id: 'reset', label: 'Reset' }` action (and scenes already have **Reset scene** in the Inspector toolbar).

The Workbench renders these controls inside the `.wb-story-frame` header using the portable shell chrome (`--wb-*` tokens), hides them automatically in `raw=1` captures, and synchronizes every change across all visible theme artboards simultaneously:

```tsx
import { useState } from 'react';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';

function RecoveryStudy({ ctx }: PreviewProps) {
  const [status, setStatus] = useState<'idle' | 'error' | 'saved'>('idle');
  const showDetails = ctx.story?.controls.details === true;

  useStoryAction(ctx, (actionId) => {
    if (actionId === 'fail') setStatus('error');
    if (actionId === 'save') setStatus('saved');
  });

  // Render pure component UI driven by status and showDetails...
  return null;
}

// In defineComponent({ cases: [...] }):
const recoveryCase = {
  id: 'recovery',
  title: 'Save and recovery flow',
  kind: 'behavior' as const,
  mode: 'live' as const,
  controls: {
    details: { kind: 'boolean' as const, label: 'Show details', default: false },
  },
  actions: [
    { id: 'fail', label: 'Simulate failure' },
    { id: 'save', label: 'Simulate success' },
  ],
  reset: true,
  render: RecoveryStudy,
};
```

### Props, Constraints, Forms, and Blocks

Every value control has a `group`, a `description`, and a `default`. The `enum` and `slot` types use stable `choices`, with optional labels and JSX `code` for slots. The Playground default column shows the initial setting in the interactive example. When a control samples a richer public type, set `publicType` (for example, `'Responsive<Spacing>'`) to display that type in the Usage table. The label affects only documentation. For an optional enum prop with a Playground `"auto"` / `"omitted"` sentinel choice, set `omit: true` on that choice so declarative rendering omits the prop, generated JSX skips it, and the Usage table lists the public union and shows `undefined` when the example starts with that choice. String and number controls accept free input. To include them in States slices and Combinator, set finite `examples` that include the default. Boolean controls supply both values. The `action` type documents a callback with an authored JSX expression such as `code: 'handleChange'`. Wire it to a real event through `ctx.action(name)` and supply the relevant event value. Mark preview-only settings with `demo: true` to keep them out of generated JSX and the public Usage prop table.

Rules apply when every value in `when` matches and at least one `affects` target applies. A target can name a key at any value or a specific `{ key, value }` pair. Give each rule a readable `reason`. `forbidden` prevents rendering the combination. `ignored` and `precedence` explain what loses effect while preserving the chosen values for the component. Fix named slice values with `fixed`. Use `states` for generated grids. Put standalone studies in `cases` and describe each study in one shared `caption` above the artboards.

When values or actions overlap in a narrow grid, inspect the field at 120% text on Base and Overlay. Select groups its sizes by field role with `rows: 'size'` and `group: 'variant'`. DatePicker keeps both role columns and sets a minimum inline size on its own comparison cells. The table can then scroll horizontally within the artboard. [Select slice](../apps/playground/src/specimens/select/select.spec.tsx) · [DatePicker cell sizing](../apps/playground/src/specimens/date-picker/date-picker-matrix.css)

The renderer is a React component. Put `ctx.subject` on the real DOM subject or pass it through a wrapper that forwards DOM props to that node. In a compound example such as [Table](../apps/playground/src/specimens/table/table.spec.tsx), mark the table itself, keep its header and body in their normal slots, and use `code(values, attributes)` to show the actual nesting or supply required props. The optional `attributes` argument contains the generated JSX attributes, with a leading space when present. Use `ctx.id` when forming native IDs and radio group names so independent artboards can share the document.

For a vertically stacked Unica study, pass `surface={ctx.surface}` to the shared `ExampleSurface`. It fills the available width and supplies the theme’s floating material when the artboard switches to Overlay. For a compact floating panel, constrain the panel itself to its intended width and check its padding and placement on narrow and wide artboards. Examples that already render a dialog or popover can use the component’s own surface. [ExampleSurface source](../apps/playground/src/specimens/shared/example-surface.tsx)

Use `form: 'wrap'` for a Workbench-provided form around a field control, `form: 'owned'` for an example form needing Workbench Submit and Reset buttons, or `form: 'inline'` for action components or example forms that supply their own submit/reset actions (for example `Button`, which must never show redundant Workbench Submit/Reset buttons underneath a regular button in Playground). For `owned` and `inline`, spread `ctx.form` on the real `<form>`. Both modes capture native submit and reset events. A controlled example handles its own state change on the native reset event.

Declare local, product-independent pairings in `compositions`. Each family has at least one. For a new family, design two to four pairings that answer distinct questions. **Always compose neighboring UI with real shipped `@docouno/unica` components** (such as `Input`, `Textarea`, `Button`, `IconButton`, `Text`, `Icon`, `Badge`, `Card`, `Divider`) rather than ad-hoc styled native `<input>` or `<button>` stand-ins — native stand-ins are only allowed when a neighboring family has not shipped yet, and must be clearly noted. Give each block a stable ID and an explanatory caption where needed. Use Case kinds `content`, `surface`, and `behavior`. Set `mode: 'pinned'` where the example fixes a visual state, or `mode: 'live'` when inspection depends on interaction. A Case can set a bounded `width` or compare material contexts with `compareSurfaces: true`. Set `surface: 'overlay'` for an inherited floating context, or `overlayStage: true` to request staging in the app's underlay. Each composition supplies a `code` sample in plain JavaScript JSX. A single JSX expression can use public components imported by its host. Give stateful examples their imports, data and handlers so the interaction works when copied. Wrap adjacent root elements in a fragment.

`ctx.tab` identifies the current inspector tab (for example `'playground'`, `'states'`, `'compositions'`), and `ctx.comparing` indicates that multiple presets are selected. Use these signals for examples that should stay closed in States grids or across multiple artboards, such as [Popover](components/popover.md).

Application compositions live independently in `src/scenes/<NN>-<slug>.scene.tsx` and default-export `defineScene(...)`. Declare consumed component IDs in `uses` to create **Consuming scenes** links on the Usage tab. Verify that the scene renders each listed family. [Folio](compositions/folio.md) is one example application. Keep its workflows in scenes and use small, product-independent compositions for the Compositions tab.

## Address and Capture a View

Live URLs and `make visual` share the following controls.

| Parameter | Values |
| --- | --- |
| `item` | A component or scene ID. Omit to open the first registered item. |
| `tab` | `playground`, `states`, `compositions`, `usage`. Scenes have a single view. Legacy `matrix` and `cases` resolve to `states`; legacy `usage&block=<id>` resolves to `compositions`. |
| `family`, `scheme` | A registered family key (`soft`, `frost`, `pixel`) or `all`, and `dark`, `light`, or `both`. Defaults are `all` and `both`. |
| `solo` | A single registered theme ID (e.g., `frost-light`) for expanded solo inspection. Overrides `family` and `scheme`. |
| `slice`, `mode` | A named slice on `states` and `overview` (default), `slice` (or `combinator`), `pairwise`, or `full`. Explicit combinator modes imply `states` when the URL has no tab. |
| `block` | A named case on `states` or a named composition on `compositions`. Omit to see the whole tab. |
| `bounds`, `surface` | Use `bounds=1` to show measurements. Set `surface=auto\|base\|overlay`. Auto uses the example's declared context. |
| `vp`, `scale`, `dir` | Width `auto\|360\|768\|1280\|1440`, scale `100\|120`, and direction `ltr\|rtl`. An omitted scene width uses its declared default. |
| `raw` | `1` for the artboards (hiding shell chrome and frame toolbars), `0` for Workbench controls as well. Captures default to `1`. |

Open `/?item=table&tab=states&block=editors` for editable rows, `/?item=text&tab=compositions&block=reader` for the text reading composition, or `/?item=button&tab=usage` for the auto-generated API reference and documentation. Previous bookmarks retain their item ID and resolve legacy tab aliases cleanly.

```sh
make visual item=button tab=states slice=roles family=all scheme=both out=button-roles.png
make visual item=table tab=states block=editors family=frost scheme=dark bounds=1 raw=0 out=table-editors.png
make visual item=date-picker tab=states block=live family=frost scheme=light surface=overlay vp=360 scale=120 dir=rtl out=date-picker-live.png
make visual item=title tab=states mode=pairwise family=soft scheme=dark bounds=1 out=title-pairs.png
make visual item=text tab=compositions block=reader family=soft scheme=both raw=0 out=text-compositions.png
make visual item=button tab=usage raw=0 out=button-usage.png
make visual item=07-invite-access-modal family=pixel scheme=light vp=360 scale=120 dir=rtl out=folio-invite.png
```

Capture rejects an unknown item or any explicit setting that the rendered view cannot honor. The retired make arguments `section` and `theme` produce an error. Select content with `tab`, `slice`, or `block` and choose themes with `family` and `scheme`. The capture runs offline at 2× resolution and writes to Git-ignored `.artifacts/visual/`. Omit `out` to use a filename derived from the selected view and its options. Motion is frozen in captures. Use `freeze=1` to request that condition in the browser. All lazy sections on `states` mount eagerly under `freeze=1` and `raw=1`. The renderer loads the current sources through Vite and keeps Chromium's native inner scrollbars visible at a fixed 900px layout height. A single-theme capture allows room for the requested natural width, and multiple themes use the live comparison layout. Test focus, typing, and overlay dismissal in the live browser.

`make visual` checks the accepted environment with `make doctor` and verifies real pnpm resolution for the renderer and local library link. It can prepare missing dependencies and headless Chromium. If setup leaves dependency resolution broken, the preparation exits with recovery instructions. The renderer uses library sources directly. Run the applicable repository checks separately as described in the [Definition of Done](../AGENTS.md#definition-of-done).

Keep other temporary evidence in `.artifacts/<task>/` inside the checkout. Stop the preview with `make down` or release its port lease with `make down cleanup=1`. The Worktrunk hooks reserve ports on creation and clean up stand resources on removal. Pass `--yes` in non-interactive sessions.

## Boundaries and Handoff

Prototype styles use semantic CSS custom properties. Do not branch on theme names or hardcode color literals. The portable `src/workbench/` shell and production component implementation stay outside ordinary design tasks. If a demonstrated material defect or missing recipe prevents the intended design, address it explicitly at the theme-token source, assess affected consumers, and verify the change and documentation. A bounded theme repair does not make the library component part of the design task.

Use the system's structural roles and established vocabulary when describing the design. Illustrative JSX and prototype controls help explain anatomy and use; exact TypeScript signatures, internal state architecture, and complete reusable focus/form/ARIA mechanisms are resolved during library implementation. Record expected user outcomes separately from mechanisms not yet implemented. Identify native stand-ins for adjacent unfinished families.

After visual approval, implement the family in `packages/ui` in a separate change. Preserve approved appearance and interaction and resolve any new product or visual conflict explicitly. Keep the same specimen ID. When the component ships, import it from `@docouno/unica` and set `status: 'UI'`.

Update the schema, examples, and JSX readout to match the shipped API. Switch scene imports to the package, remove the temporary prototype and its component CSS, and retain example layout styles. Record the public contract in `docs/components/<family>.md`. Run the repository checks, tests, build, package verification, and visual inspection before handoff.
