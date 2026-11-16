# Card — visual specification

Status: visual design approved on 2026-11-16. This prototype is a live reference for a later library implementation, not an export from `@docouno/unica`. Open `/?item=card`. Its illustrative props and DOM are replaceable; the visual and interaction decisions below are the handoff.

## Purpose and boundaries

Card groups one entity or related content on a bounded, neutral surface. It may contain text, media, metadata, form controls, and local actions. A card does not automatically become interactive because it has a border or shadow.

There are three patterns:

| Pattern                               | Target and feedback                                                                                                                                                              |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static content or a group of controls | No root Tab stop, pointer cursor, hover, or pressed appearance. Each contained control keeps its own interaction.                                                                |
| Short navigation summary              | One real anchor named by the title; the complete card is its hit area. Pointer hover and held press affect the plate; keyboard focus outlines its perimeter. No nested controls. |
| Rich content with independent actions | A real title link, a separate header action, and independent footer controls. Only the hovered or focused target responds. Body text remains selectable.                         |

Selection belongs to a separate checkbox, radio, or switch. The live example shows a checkbox selecting an entity for export beside an independent title link. Card has no `selected`, `aria-pressed`, or toggle authority. Form-like option tiles belong to CheckboxCard, RadioCard, and SwitchCard. Feedback belongs to content or an Alert; Card has no status tone, `loading`, or global `disabled` mode.

A restricted entity may retain a quiet dashed frame, a lock, a readable reason, and a disabled destination action. Do not apply opacity or `inert` to the whole readable card. If an entity cannot be opened, remove its navigation link rather than leave a dead focusable anchor. Other available actions, such as requesting access, remain usable when the consuming application provides them.

## Surface and geometry

| Tier | Padding | Gap  | Outer radius in Soft/Frost | Inset media radius |
| ---- | ------- | ---- | -------------------------- | ------------------ |
| S    | 12px    | 8px  | 10px                       | 4px                |
| M    | 16px    | 12px | 12px                       | 4px                |
| L    | 24px    | 16px | 16px                       | 4px                |

All rectangular corners resolve to zero in Pixel. Size changes density; it does not automatically change title importance or font size. The normal card title uses `body-m` at semibold weight; descriptions use secondary `body-s`, and metadata uses muted `caption-l`. A larger title is an explicit typography choice by the composition.

- **Default:** contextual `--card-bg`, a 1px `--card-border` edge, and `--card-shadow`; on Base these resolve to `--bg-surface`, `--border-default`, and `--surface-shadow`. Soft is matte; Frost is a dense plate with the existing fine rim and shadow recipe; Pixel is flat with crisp corner registration marks.
- **Subtle:** contextual `--card-bg-subtle` and `--card-border-subtle` (the ordinary subtle surface/edge on Base), no shadow, and no corner marks. It supports nearby content without competing with primary entities.
- **Overlay context:** the enclosing floating surface owns glass, rim, and elevation. Frost cards use translucent fills and edges so the shared material remains visible; default is more prominent than subtle. Soft and Pixel keep their opaque fills. All three remove the card shadow. Card never applies `backdrop-filter` itself. Hover and held press retain the contextual translucency; focus remains a separate solid outline. A new theme or explicit `data-surface="base"` boundary restores ordinary card materials. Ordinary Card nesting does not establish an overlay context.
- **Nesting:** one quiet supporting card may sit inside a primary card. Do not create a third nested card level.

Frost overlay recipe (theme-owned alpha values):

| Token                                   | Dark          | Light                             |
| --------------------------------------- | ------------- | --------------------------------- |
| `--card-bg`                             | White at 4.5% | White at 48%                      |
| `--card-bg-subtle` / held press         | White at 1.8% | Slate ink `rgb(15 23 42)` at 2.5% |
| `--card-bg-hover`                       | White at 7.5% | White at 68%                      |
| `--card-border`                         | White at 10%  | Slate ink at 10%                  |
| `--card-border-subtle` / inner dividers | White at 5.5% | Slate ink at 5.5%                 |
| `--card-border-hover` / held press      | White at 18%  | Slate ink at 18%                  |

These are fill/edge alphas, not whole-card opacity; text and controls remain fully readable. The enclosing overlay's fill and blur remain unchanged. Card is the sole consumer of the new contextual recipe; existing field and choice-card recipes retain their own hierarchy.

Media-to-content spacing follows the surface padding: S 12px, M 16px, L 24px, in vertical, horizontal, and stacked layouts. The tighter 8/12/16px gap remains the rhythm between content groups.

Use the content hierarchy, not a uniformly high-contrast outline, to separate information. Static borders are structural decoration, not an interactive control boundary.

## Anatomy

All parts are optional. A short card can contain a title and a description directly; no mandatory wrappers are introduced solely for layout.

| Part            | Decision                                                                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CardHeader      | Text column `minmax(0, 1fr)` plus an optional auto-sized action column; top aligned, 12px column gap, 4px between title and description.                                                                             |
| CardTitle       | Real h1–h6 chosen to fit the surrounding outline, h3 in examples. Wrap naturally; no automatic ellipsis or line clamp.                                                                                               |
| CardDescription | Secondary paragraph below the title. Never substitutes for the action's accessible name.                                                                                                                             |
| CardAction      | Compact independent action or badge at the inline end, aligned with the title's first line. Do not put a toolbar or long action sentence here; use the footer.                                                       |
| CardBody        | Arbitrary flow content with the card's gap. Can grow to align footers when the parent grid stretches its children.                                                                                                   |
| CardFooter      | Wrapping row with start, end, or between alignment. 8px row gap and 12px column gap. Optional top divider adds one card gap of padding. No divider by default.                                                       |
| CardSection     | Inset or full-width region. Optional divider separates heterogeneous content; optional padding restores the card inset for rows or notes.                                                                            |
| CardMedia       | A clipped media frame with an explicit aspect ratio when needed. Cover crops photographs; contain preserves complete images or diagrams. The caller supplies meaningful alt text, or `alt=""` for decorative covers. |

CardAction aligns the complete action box with the content inset. A header icon button therefore has the same top and inline-end spacing: S 12px, M 16px, L 24px. In the shown ghost IconButton, the centered glyph, hit area, hover/pressed plate, and focus contour retain the same position in every state. Card adds no movement; other Button roles retain their own theme-defined press behavior. Do not hang the button into the gutter to align the visible glyph with text; a passive icon and a button have different painted bounds. The compact action retains the Button family's normal target sizing: 30×30px with a fine pointer and at least 44×44px with a coarse pointer. Card does not reduce it; RTL mirrors the layout.

Footers grow vertically when labels do not fit; they do not overflow or hide actions. A short neighboring card may have extra body space to align its footer, while longer content remains visible. No built-in fixed card height, equal-height truncation, content scrolling, or collapsible behavior is introduced.

## Media and orientation

Inset media follows `min(R_outer, max(--radius-xs, R_outer − padding))` on all four corners. Flush media touches the inner border: an M card has 11px outer media corners inside a 12px card radius and 1px edge. Seams facing the body remain square. A flush section at the end gets the bottom corners; a single section gets all four. Clip media itself, not the entire card, so control focus rings and floating children can escape.

A media region meets adjacent content at one full surface inset, including media at the top, bottom, or between content groups. Adjacent media regions share one interval. This applies to direct CardMedia and CardMedia inside a flush/inset CardSection.

A horizontal card has an inline-start media region and a content column in a 1:2 ratio. At a card content width below 28rem it stacks into the vertical composition, with media at the top. The card responds to its available width, not the viewport. RTL mirrors inline-start media and actions; it does not mirror photographs or nondirectional diagrams. The specimen uses a 4:3 frame for the horizontal example; when stacked the same frame remains reserved.

If an image fails, preserve its aspect ratio and show a quiet image glyph plus “Preview unavailable”. Keep the title and any available document action. A retry restores the image in the same frame. If the entity has no image at all, omit the media section without reserving a blank slot. Asset fetching, error detection, and retry transport belong to the consumer; the specimen uses an explicit local switch to compare the two states.

## Interaction and availability

| State                   | Appearance and expected outcome                                                                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest                    | Ordinary material. A navigation summary includes a title and directional affordance.                                                                                                                                   |
| Hover                   | On a fine hover pointer, the navigation plate uses `--card-bg-hover` and `--card-border-hover`; its title underlines. Rich cards only underline their title link.                                                      |
| Held press              | Navigation plate uses `--card-bg-subtle` with `--card-border-hover` and no external shadow. No translation, scaling, or change to text layout.                                                                         |
| Keyboard focus          | Independent 2px `--focus-ring-color` contour with 2px offset. Complete perimeter for the short card's single link; target-sized ring for rich title links and sibling actions. Remains visible during hover and press. |
| Selection               | Checkbox checkmark and label expose selection; the Card surface is unchanged. Toggling it does not navigate.                                                                                                           |
| Unavailable destination | Readable content, reason, lock, dashed edge, no shadow or corner ticks. Destination button is disabled and skipped by Tab.                                                                                             |
| Loading                 | Skeleton replaces only unknown content inside a stable reserved region; a visible loading message and `aria-busy` identify the pending region. Existing usable controls must not be hidden or disabled by Card.        |
| Empty                   | A short explanation and appropriate next step live in the body. Keep the same neutral shell.                                                                                                                           |
| Error                   | Explain the failed content or action locally and offer an applicable retry. Do not recolor the entire card as an error surface.                                                                                        |

For a short navigation summary, pointer activation and Enter follow the real link; Space retains browser link behavior. Its accessible name comes from the title, not all of the card's metadata. The prototype uses a stretched title anchor; its trade-off is that selecting the summary text is unavailable. Use the rich pattern when readers need to select text or interact with multiple targets. A native whole-card anchor is an acceptable library implementation for simple noninteractive content if it preserves the same concise accessible name and focus treatment.

The live navigation examples link to an instance-specific local preview. The destination is focusable so native fragment navigation gives keyboard users a continuation point. Saving, selecting, retrying, and changing preview controls use local state. No application route, network request, or menu engine is simulated.

Card feedback is a 120ms color/border transition in all materials. Card geometry stays stationary in every theme; button physics do not propagate to the enclosing surface. Reduced motion removes the transition. Pinned state studies do not set DOM focus or intercept input. In forced colors, use system surface/border/link colors, retain a dashed unavailable boundary, and draw a 1px ButtonText focus outline. Native controls keep their own system treatment.

## Inspection and integration

| Section        | Design question                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `hierarchy`    | Default/subtle across S/M/L; material emphasis and density.                                                                 |
| `anatomy`      | Title/description/action alignment; metadata, arbitrary body, and optional footer line.                                     |
| `media`        | Flush/inset, cover/contain, top/bottom corners, no media, horizontal stacking.                                              |
| `sections`     | Divided full-width region, footer controls, body-only card, one quiet nested group.                                         |
| `navigation`   | Live single target, rich title link, save, explicit checkbox selection, local destination.                                  |
| `states`       | Pinned rest/hover/press/focus and intersections, with role and size selectors.                                              |
| `availability` | Controlled loading/content comparison, empty, restricted destination, failed/restored image.                                |
| `overflow`     | Long title and unbroken text, header badge/action, uneven content, wrapping footer.                                         |
| `overlay`      | Two hierarchy levels, pinned states, and live links/actions inside an actual floating material over the workbench underlay. |

Inspect all six presets, Base and Overlay, 360/768/1280/1440px, 120% text, RTL, reduced motion, and forced colors. Existing Folio scenes consume this prototype independently: auth, overview, collection, directory, extensions, preferences, and import. Verify them directly; do not copy their screens into this specimen.

The later implementation must supply the exact React 19/TypeScript API, root-host delegation and validation, ref behavior, full accessible composition guarantees, and contract tests. Preserve the approved anatomy, material, interaction boundaries, overflow, and unavailable-content decisions. These engineering obligations do not turn the prototype's helper classes or state pins into public props.

Research references: [Radix Card](https://www.radix-ui.com/themes/docs/components/card), [Mantine Card sections](https://mantine.dev/core/card/), and [Inclusive Components: Cards](https://inclusive-components.design/cards/).
