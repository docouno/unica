# Button & IconButton — visual specification

Status: approved visual reference. This live prototype is the visual reference for the subsequent library implementation; it is not a package export. Open `/?item=button` in the playground. Application [scenes](../../scenes/) consume the same prototype independently. They are integration consumers, not component requirements.

## Action language

| Axis   | Choice      | Use                                                                                        |
| ------ | ----------- | ------------------------------------------------------------------------------------------ |
| Weight | `primary`   | The main next step in a surface: create, publish, confirm, or commit a destructive action. |
| Weight | `secondary` | A visible alternative: preview, share, cancel, or discard.                                 |
| Weight | `ghost`     | Repeated tools, quiet row actions, overlay Close, and low emphasis commands.               |
| Tone   | `accent`    | The product's forward action, or an accent command.                                        |
| Tone   | `neutral`   | Supporting actions and dense toolbars.                                                     |
| Tone   | `danger`    | Removal or a harmful consequence; use a named action for irreversible operations.          |

All nine combinations exist on both controls. The role changes visual weight; the tone changes meaning. Do not use success, warning, or info colors on an action. Result and validation feedback live next to it.

Prefer one primary action per decision group. Use neutral ghost tools in a formatting bar and neutral secondary alternatives beside a main CTA. Avoid a permanent row of filled icon buttons in document lists. A reversible row removal can use a danger IconButton with a specific accessible name, a tooltip, and Undo. Permanent deletion uses a labeled danger Button in a confirmation surface.

`pressed` is a persistent command state, such as Bold, Pin, or Mute alerts. It does not represent the current navigation destination, a settings field, a selected filter, or an open menu. Use navigation with `aria-current`, Switch/Checkbox, Chip/SegmentedControl, or an `aria-expanded` trigger respectively. Button-shaped links share the action geometry; inline links belong to Link.

## Anatomy and sizing

The root contains a content row with an optional leading icon, a label, and an optional trailing icon. An independent central progress indicator covers this row while loading. IconButton uses the same recipe and a square root with one centered glyph. Icons inherit the action's foreground.

| Metric                               | S                | M    | L    |
| ------------------------------------ | ---------------- | ---- | ---- |
| Minimum height / IconButton side     | 30px             | 40px | 48px |
| Glyph / progress indicator           | 14px             | 16px | 20px |
| Icon-to-label gap                    | 6px              | 8px  | 10px |
| Plain label horizontal padding       | 12px; Pixel 10px | 16px | 20px |
| Padding on a side containing an icon | 8px              | 12px | 16px |
| Vertical padding for wrapped labels  | 5px              | 8px  | 10px |
| Radius in Soft / Frost               | 6px              | 8px  | 10px |
| Radius in Pixel                      | 0px              | 0px  | 0px  |
| Font in Soft / Frost                 | 13px             | 14px | 16px |
| Font in Pixel                        | 11px             | 12px | 14px |

Labels use the theme's base font, weight 600, and line height 1.3. Heights are minimums: text can increase them. At 120% text, the font grows while the component retains its minimum height, icon size, and spacing. IconButton stays square.

Use S for desktop chrome, table rows, and compact popovers; M for ordinary product actions and dialog footers; L for prominent standalone forms. Keep the same size within an action row. On a coarse primary pointer, S and M grow to a visible minimum 44×44px target, including IconButton. This growth participates in layout, so neighboring hit regions do not overlap. Glyph sizes retain their selected S/M/L scale.

`width="auto"` fits content; `width="full"` fills its available inline width. Long labels wrap naturally without truncation or a line clamp. Unbroken content can break as a defensive fallback. Icons remain at the logical ends of the label and align to its vertical center. Leading and trailing slots follow reading direction; directional navigation arrows mirror in RTL, while a brand glyph, vertical chevron, or external-link symbol retains its meaning.

## Materials and response

All colors and materials come from the existing semantic theme tokens. There are no theme-name selectors or consumer material switches in this family.

| Theme | Primary                                                                                                                                           | Secondary                                                                                     | Ghost                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Soft  | Flat matte fill; color feedback. No external shadow, inset depth, or displacement.                                                                | Flat matte plate; color/edge response, no displacement.                                       | Transparent at rest; tint response, no displacement. |
| Frost | Raised plate with a 2px vertical contact edge. Press moves down 2px and collapses the edge. Accent retains its violet gradient and ambient light. | Quiet 1px contact edge and small diffuse shadow. Press moves down 1px and collapses the edge. | Tint response without elevation or movement.         |
| Pixel | Flat signal fill and sharp 1px edge. Instant color/edge response; no block shadow, inset depth, or displacement.                                  | Flat bordered plate with the same discrete response.                                          | Transparent at rest; discrete tint response.         |

Tone changes palette, not press distance. Every Frost primary tone presses 2px; secondary presses 1px. Neutral and danger primary use a neutral contact shadow without violet light. Selected commands remain in place; Frost may express inset depth, while Soft/Pixel use fill and a structural keyline.

The theme owns press transforms, elevation, inset depth, and transition duration. Corner geometry never determines material physics. Soft/Frost transitions take 120ms; Pixel changes immediately. The spinner makes one linear turn in 800ms. Reduced motion removes transitions and pointer light and leaves a static progress indicator.

Fine-pointer light belongs to primary accent and is emitted outside its opaque fill. It responds to proximity before the pointer enters the hit box. The theme owns `--btn-primary-backlight-reach`: `100px` in Frost, `0px` in Soft/Pixel. Distance is measured from the nearest edge in local CSS pixels; intensity follows `max(0, 1 - distance / reach)`. The existing `72px` radial spot and `10px` blur make the approach most visible close to the edge; the sampling reach is not a promise of a painted 100px halo.

Approach retains the rest fill, label, border, and contact height. Actual hover then applies the separate hover plate and ambient recipe. Crossing the hit-box boundary does not switch the pointer light on abruptly. Moving away fades it out at its last position. The opaque face covers the light, preserving text/glyph luminance. Held press, selection, loading, disabled, touch, reduced motion, and forced colors suppress pointer light. Fully covered controls do not react through the foreground surface. Passive ambient material may remain while loading.

The prototype shares one document-level pointer sampler between local bindings, batches updates with `requestAnimationFrame`, and writes only light properties. It does not send coordinates through React state/context. Range-zero themes retain a cheap pointer sample for a stationary-pointer theme change, without pointer-driven geometry or paint when no effect is active. Theme/surface and layout changes refresh the recipe and geometry. The scaled workbench normalizes coordinates to the button's local space. A center-point visibility check suppresses fully covered controls; partial occlusion and complete overlay-scope integration remain library work. Its reach input accepts nonnegative literal `px` values. This helper demonstrates the design; it is not a shipped provider or a general transform/portal/Shadow DOM engine.

## States and precedence

Visual priority is **disabled → loading → held press → hover → selected/open → rest**. Focus is additive to every available state. Selected/open state supplies the underlying plate before transient states are applied.

| State               | Visual and interaction decision                                                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest                | Theme material at the chosen weight and tone.                                                                                                                                                                                                                                                       |
| Hover               | A real fill/depth response on a fine hover pointer. Every role, tone, and selected command has an explicit recipe.                                                                                                                                                                                  |
| Active              | Held pointer/Space press. Use the material's fill, shadow, and displacement; do not make a ghost control move.                                                                                                                                                                                      |
| Focus               | A 2px ring with a 2px gap using `--focus-ring-color`. Keep the plate and selected keyline intact. Focus remains visible during press and loading.                                                                                                                                                   |
| Selected            | Secondary/ghost use a quiet tint and structural keyline; only raised material adds inset depth. Neutral uses the raised neutral surface. Hover and press modestly deepen this plate. No external shadow or mechanical displacement.                                                                 |
| Primary selected    | A retained active fill; raised material may add inset depth. The plate stays in place in every theme. This combination is supported; quiet toolbar selection is normally secondary/ghost.                                                                                                           |
| Open                | An `aria-expanded="true"` secondary trigger retains its hover plate and rim; ghost retains its tint plate. There is no selected inset keyline, pressed semantics, or permanent displacement. Primary retains its ordinary filled role.                                                              |
| Loading             | Keep the exact label-and-icon layout in place but visually hide its content row; show a centered ring in the same foreground. Preserve the accessible name and keyboard focus. Block repeat activation and transient hover/press response. The application shows a visible operation status nearby. |
| Disabled            | Muted foreground, no external shadow/light, and no activation. Filled roles use the quiet disabled plate. Ghost stays transparent. Native disabled fields and disabled fieldsets share this appearance.                                                                                             |
| Selected + disabled | Preserve a subdued inset keyline so the current command state is still discoverable.                                                                                                                                                                                                                |
| Disabled + loading  | Disabled wins: show the disabled label/glyph and hide the progress indicator. Do not leave a frozen busy glyph as the unavailable action.                                                                                                                                                           |

The centered loading indicator is intentional: adding a spinner to a text-only action would either shift content or reserve an unnecessary permanent slot. One universal overlay preserves geometry for text-only, one/two-icon, full-width, multiline, and square controls. The adjacent status retains the operation's identity. Do not introduce `loadingLabel`, success/error button variants, or different spinner placement per icon configuration.

The prototype has native Tab/Enter/Space behavior, a simple pending click guard, and controlled selected commands. IconButton requires an accessible name. Tooltip composition and dismissal belong to the consuming UI and the Tooltip family. In forced colors, use system ButtonText borders, Highlight/HighlightText selected plates, an independent outer focus ring, and GrayText unavailable controls. Keep selected + disabled structurally distinct with a dashed edge.

## Specimen scope and integration

The Button specimen contains its own roles, tones, sizes, slots, square controls, interaction/availability states, selected/open intersections, and overflow behavior. Application forms, dialogs, editors, and product workflows remain in scenes.

Small product-independent arrangements may clarify a component decision, such as adjacent actions. They are optional. A new application or composition never creates an obligation to add Button cases. Verify product fit directly in the consuming scenes: those scenes import the shared family and inherit updates automatically.

| Section                                     | Covers                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `light`                                     | Live primary/secondary/ghost response and pinned rest → approach → hover comparison on Button and IconButton. |
| `roles`, `sizes`                            | Nine role/tone combinations, S/M/L, slots, full width, square geometry.                                       |
| `states`, `states-neutral`, `states-danger` | Rest, hover, active, focus, focus+active, loading, loading+focus, disabled, disabled+loading; S/M/L selector. |
| `toggles`                                   | Live selection and combined states; every tone and size.                                                      |
| `open`, `overflow`                          | Pinned expanded-trigger visuals, long/unbroken labels, stable loading geometry.                               |

Use 6-up, Focus, Base/Overlay, 360/768/1280/1440px, 120% Text, and RTL. Check integration separately in relevant application scenes:

```sh
make visual item=button section=light
make visual item=button section=states-danger
make visual item=button section=overflow mode=focus theme=pixel-light vp=360 scale=120 dir=rtl
```

`previewState` and `previewFocus` only pin specimen visuals; they are not proposed package API. React 19 refs, `asChild`, uncontrolled toggles, native form submission/reset, disabled link guards, full tooltip positioning, modal focus return, and focus after completion/removal belong to the subsequent library implementation. Follow the repository's accessibility and forms contracts for those behaviors. Replace the prototype imports and remove the temporary Button prototype, CSS, and sampling helper when the library family ships.
