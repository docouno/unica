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

Preview frames keep the heading and the live content together. A named slice, case, or usage example has one shared frame around its theme comparison. Each full scene has a frame around its artboard. **Reset scene** restores the initial state of the scene across the selected themes and keeps the current view settings and URL.

Every component has the same four views.

| View | What to inspect |
| --- | --- |
| Playground | Change the component properties in one place and compare the resulting subjects across themes. Review formatted, syntax-highlighted JSX and any events supplied by the example. The event log keeps the latest 100 entries and reports how many earlier entries it omitted. Form examples support native Submit and Reset and show the submitted FormData. |
| Matrix | Select a named slice or choose Rows, Columns, and an optional Group. Global values apply across the view. Forbidden cells show N/A, and ignored or lower-priority values retain their explanation. |
| Cases | Explore overflow, material, and behavioral examples. Pinned examples identify conditions set by the author. |
| Usage | Review a small composition and follow links to registered scenes that consume the component. Browser Back returns to the Usage view. |

The full-height **Inspector** on the right holds the settings for the current view. Preview settings stay in the header above the canvas. In Playground, the Controls, Events, and FormData tabs share the panel with live JSX. The selected tab and JSX scroll independently. In Matrix, the panel holds the slice, axes, mode, and global values. Cases and Usage put their example picker there. On narrow screens, **Inspector** opens the same panel over the right edge of the preview.

Selecting an axis releases any global value for that property. Fixing a property removes it from the free axes. Large Slice and Pairwise views load more rows as you scroll. The **Show more rows** button also supports keyboard navigation. Frozen captures include the entire result.

Pairwise covers every pair of finite values that has a valid completion under the current fixed values. Read the coverage count before treating it as an audit. Full shows every combination, including N/A cells, while the total across selected themes fits in 64 displayed cells.

Choose Family and Scheme independently. All × Both compares all available presets. Select one family and one scheme, or click an artboard header, to inspect a single theme at natural size. Change Surface, Width, 120% Text, and RTL to stress the selected example. A fixed width applies to the frame and its viewport. The surrounding layout keeps the full grid track available. Frames in the Playground share the available height. At a fixed width, each row fits as many frames as the available space allows. When both schemes are selected, each family keeps its dark and light previews together. Comparisons scale down when needed in browsers with CSS zoom. Wider frames in focus mode and comparison frames on other browsers can be scrolled horizontally. Bounds measures authored subjects in CSS pixels. Use browser Back and Forward to revisit item, tab, and theme selections.

The page heading shows the item name and, for components, the implementation status. The theme canvas is applied to the live sample. Matrix coordinates and review notes use Workbench typography, and Cases and Usage show each caption once above the theme comparison. Usage shows one JSX snippet per authored example.

The Workbench owns a grayscale palette and compact recipes for fields, segments, buttons, and navigation. Those styles and the font assets load with the shell. Changing a preview theme changes the examples while the inspection controls keep their appearance. Workbench fields change the border on focus and show a separate outline during keyboard navigation. Select fields use the system menu on browsers without customizable native pickers.

Each checkout leases a sticky loopback port. `make up` builds the playground's dependencies before starting Vite, which serves library source changes via HMR. For reverse-proxied preview, set `DEVKIT_PREVIEW_URL_TEMPLATE` with the desired URL and placeholders (`{port}`, `{service}`, `{branch}` or `{slug}`) in the environment or a Git-ignored root `.env` file. Confirm the address with `make info`.

## Author a Specimen

Place each catalog entry under `apps/playground/src/specimens/<family>/*.spec.tsx` and default-export `defineComponent` from `../../workbench/types.js`. The playground discovers these files automatically. Keep design-only component implementations and their semantic CSS under `src/prototypes/<family>/`. Put reusable example helpers next to the family or its specimen.

Use a stable `id`, a `title`, a catalog `category`, and a `status`. The same props drive Playground controls and Matrix. This minimal Title example demonstrates an author-declared rule.

```tsx
import { Title } from '../../prototypes/title/title.proto.js';
import { defineComponent } from '../../workbench/types.js';

export default defineComponent({
  id: 'article-title',
  title: 'Article title',
  category: 'Typography',
  status: 'Proto',
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
  matrixViews: [{ id: 'overflow', title: 'Line limits', rows: 'lineClamp', cols: 'truncate' }],
  code: ({ truncate, lineClamp }) =>
    `<Title${truncate ? ' truncate' : ''}${lineClamp ? ` lineClamp={${lineClamp}}` : ''}>Release notes for the document editor</Title>`,
  render: ({ values, ctx }) => (
    <Title {...ctx.subject} truncate={values.truncate} lineClamp={values.lineClamp}>
      Release notes for the document editor
    </Title>
  ),
});
```

Every value control has a `group`, a `description`, and a `default`. The `enum` and `slot` types use stable `choices`, with optional labels and JSX `code` for slots. String and number controls accept free input. To include them in Matrix, set finite `examples` that include the default. Boolean controls supply both values. The `action` type documents a callback with an authored JSX expression such as `code: 'handleChange'`. The property key supplies the attribute name. Wire it to a real event through `ctx.action(name)` and supply the relevant event value. Mark preview-only settings with `demo: true` to keep them out of the generated JSX.

Rules apply when every value in `when` matches and at least one `affects` target applies. A target can name a key at any value or a specific `{ key, value }` pair. Give each rule a readable `reason`. `forbidden` prevents rendering the combination. `ignored` and `precedence` explain what loses effect while preserving the chosen values for the component. Fix named slice values with `fixed` and use `reference` for authored examples that illuminate that slice.

The renderer is a React component. Put `ctx.subject` on the real DOM subject or pass it through a wrapper that forwards DOM props to that node. In a compound example such as [Table](../apps/playground/src/specimens/table/table.spec.tsx), mark the table itself, keep its header and body in their normal slots, and use `code(values, attributes)` to show the actual nesting or supply required props. The optional `attributes` argument contains the generated JSX attributes, with a leading space when present. Use `ctx.id` when forming native IDs and radio group names so independent artboards can share the document. For a form example, use `form: 'wrap'` for a Workbench-provided form or `form: 'owned'` if the example already supplies one. In an owned example, spread `ctx.form` on the real `<form>`. A controlled example handles its own state change on the native reset event.

Give each Case and Usage block a stable ID and an explanatory caption where needed. Use Case kinds `content`, `surface`, and `behavior`. Set `mode: 'pinned'` where the example fixes a visual state, or `mode: 'live'` when inspection depends on interaction. A Case can set a bounded `width` or compare material contexts with `compareSurfaces: true`. Set `surface: 'overlay'` for an inherited floating context, or `overlayStage: true` to request staging in the app's underlay. The overlay component paints its own panel with semantic tokens. Usage blocks may include a short JSX `code` sample beside their render. Wrap adjacent root elements in a JSX fragment so the snippet can be formatted and copied as one expression.

Application compositions live independently in `src/scenes/<NN>-<slug>.scene.tsx` and default-export `defineScene(...)`. Declare consumed component IDs in `uses` to create Usage links. Verify that the scene renders each listed family. [Folio](compositions/folio.md) is one example application. Keep its workflows in scenes and use small, product-independent compositions for component usage.

## Address and Capture a View

Live URLs and `make visual` share the following controls.

| Parameter | Values |
| --- | --- |
| `item` | A component or scene ID. Omit to open the first registered item. |
| `tab` | `playground`, `matrix`, `cases`, `usage`. Scenes have a single view. |
| `family`, `scheme` | A registered family key (`soft`, `frost`, `pixel`) or `all`, and `dark`, `light`, or `both`. Defaults are `all` and `both`. |
| `slice`, `mode` | A named Matrix slice and `slice`, `pairwise`, or `full`. Pairwise and Full imply Matrix if the URL has no tab. |
| `block` | A named Cases or Usage block. Omit to see the whole tab. |
| `bounds`, `surface` | Use `bounds=1` to show measurements. Set `surface=auto\|base\|overlay`. Auto uses the example's declared context. |
| `vp`, `scale`, `dir` | Width `auto\|360\|768\|1280\|1440`, scale `100\|120`, and direction `ltr\|rtl`. An omitted scene width uses its declared default. |
| `raw` | `1` for the artboards, `0` for Workbench controls as well. Captures default to `1`. |

Open `/?item=table&tab=cases&block=editors` for editable rows or `/?item=text&tab=usage&block=reader` for the text reading composition. Previous bookmarks retain their item ID and use current defaults for retired parameters.

```sh
make visual item=button tab=matrix slice=roles family=all scheme=both out=button-roles.png
make visual item=table tab=cases block=editors family=frost scheme=dark bounds=1 raw=0 out=table-editors.png
make visual item=date-picker tab=cases block=live family=frost scheme=light surface=overlay vp=360 scale=120 dir=rtl out=date-picker-live.png
make visual item=title tab=matrix mode=pairwise family=soft scheme=dark bounds=1 out=title-pairs.png
make visual item=07-invite-access-modal family=pixel scheme=light vp=360 scale=120 dir=rtl out=folio-invite.png
```

Capture rejects an unknown item or any explicit setting that the rendered view cannot honor. The capture runs offline at 2× resolution and writes to Git-ignored `.artifacts/visual/`. Omit `out` to use a filename derived from the selected view and its options. Motion is frozen in captures. Use `freeze=1` to request that condition in the browser. The renderer loads the current sources through Vite and keeps Chromium's native inner scrollbars visible at a fixed 900px layout height. A single-theme capture allows room for the requested natural width, and multiple themes use the live comparison layout. Test focus, typing, and overlay dismissal in the live browser.

`make visual` checks the accepted environment with `make doctor` and verifies real pnpm resolution for the renderer and local library link. It can prepare missing dependencies and headless Chromium. If setup leaves dependency resolution broken, the preparation exits with recovery instructions. The renderer uses library sources directly. Run the applicable repository checks separately as described in the [Definition of Done](../AGENTS.md#definition-of-done).

Keep other temporary evidence in `.artifacts/<task>/` inside the checkout. Stop the preview with `make down` or release its port lease with `make down cleanup=1`. The Worktrunk hooks reserve ports on creation and clean up stand resources on removal. Pass `--yes` in non-interactive sessions.

## Boundaries and Handoff

Prototype styles use semantic CSS custom properties. Do not branch on theme names or hardcode color literals. The portable `src/workbench/` shell and production component implementation stay outside ordinary design tasks. If a demonstrated material defect or missing recipe prevents the intended design, address it explicitly at the theme-token source, assess affected consumers, and verify the change and documentation. A bounded theme repair does not make the library component part of the design task.

Use the system's structural roles and established vocabulary when describing the design. Illustrative JSX and prototype controls help explain anatomy and use; exact TypeScript signatures, internal state architecture, and complete reusable focus/form/ARIA mechanisms are resolved during library implementation. Record expected user outcomes separately from mechanisms not yet implemented. Identify native stand-ins for adjacent unfinished families.

After visual approval, implement the family in `packages/ui` in a separate change. Preserve approved appearance and interaction and resolve any new product or visual conflict explicitly. Keep the same specimen ID. Once the package exports the component, switch the import and status as shown for the Title example.

```diff
-import { Title } from '../../prototypes/title/title.proto.js';
+import { Title } from '@docouno/unica';

 export default defineComponent({
   id: 'article-title',
-  status: 'Proto',
+  status: 'UI',
```

Update the schema, examples, and JSX readout to match the shipped API. Switch scene imports to the package, remove the temporary prototype and its component CSS, and retain example layout styles. Record the public contract in `docs/components/<family>.md`. Run the repository checks, tests, build, package verification, and visual inspection before handoff.
