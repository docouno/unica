# Alert — visual and interaction reference

Status: visually approved on 2026-11-16. Open `/?item=alert`. This disposable prototype specifies appearance and expected user outcomes; its props and DOM do not freeze the package API.

## Purpose and boundaries

Alert is a persistent message in document flow, close to the content it explains. One family covers form summaries, section warnings, page notices, and editorial callouts. It fills its parent's width; page notices retain page gutters and do not become fixed viewport banners. Write a short, specific title, then the consequence or next step without repeating it. An error explains how to recover.

Use Toast for transient arrivals, Modal for blocking decisions, FormField for an individual input error, Empty when content itself is absent, and Card for promotion. Alert has five meanings (`neutral`, `info`, `success`, `warning`, `danger`) and three densities (`s`, `m`, `l`); defaults are neutral and M. There are no material variants, loading/disabled surfaces, hover treatments, selection, or root tab stops.

## Anatomy and geometry

Reading order: status glyph, content, optional close. Content stacks title, description, and actions. Neutral has no automatic icon. Chromatic statuses retain a filled non-color signal: information circle, checked circle, warning triangle, crossed circle. A meaningful custom glyph may replace it. Null or false cannot suppress a chromatic glyph. Glyphs are decorative to assistive technology; visible copy names the condition.

| Detail                 | S                            | M                  | L            |
| ---------------------- | ---------------------------- | ------------------ | ------------ |
| Intended density       | Compact sections, inspectors | Forms and sections | Page notices |
| Padding                | 12px                         | 16px               | 24px         |
| Column gap             | 8px                          | 12px               | 16px         |
| Soft/Frost text / line | 14px / 20px                  | 16px / 24px        | 18px / 28px  |
| Pixel text / line      | 12px / 20px                  | 14px / 24px        | 15px / 28px  |
| Filled status glyph    | 14px                         | 16px               | 20px         |
| Fine-pointer close box | 24px                         | 24px               | 28px         |

Every size uses `--surface-m-radius`: 12px in Soft/Frost, 0px in Pixel. Title uses body size at 600 weight; description retains the same readable ink at normal weight. The content gap is 4px. Glyph and fine-pointer close align with the first line, including wrapped titles. The content yields width before either control. Removing an optional icon/close removes its column and gap.

`AlertTitle` defaults to a div; use h2–h6 when it is an actual document heading. `AlertDescription` accepts prose, short lists, inherited Code, and links. Bare text, title-only, and description-only notices are valid. Null, undefined, false, or empty-string slots leave no wrapper; zero remains visible. Entirely empty alerts are invalid. Do not use empty fragments as spacing instructions.

## Material and readability

- Soft: opaque pastel status ground, warm ink, no border or shadow.
- Frost: status ground and uniform 1px semantic contour. No independent blur, rim light, elevation, or shadow; an enclosing overlay owns its glass.
- Pixel: opaque status ground, 1px semantic perimeter, 2px **total** logical inline-start edge. The edge mirrors in RTL. No surface press displacement or motion.

The bounded theme recipe `--alert-edge-width` is 0px in Soft/Frost and 2px in Pixel. `--alert-border-width` controls the perimeter. Component CSS does not branch on theme names. Existing consumers use this Alert rather than a second callout implementation in the feedback sketch.

Glyphs use readable status ink, matching the copy. Some general signal colors are too dark on Frost Dark status grounds. Hierarchy comes from weight, spacing, and wording. Do not dim descriptions or turn an error into a saturated red billboard. Inline links inherit ink with a persistent underline; Code inherits Alert's status plate recipe. Focus uses local ink for reliable contrast on each ground.

## Contextual color

A painted Alert supplies `--action-context-ink` alongside its existing Code context. Ordinary `secondary` and `ghost` neutral Buttons and IconButtons consume that ink automatically. Their tone still describes a supporting action; it does not acquire a warning, success, or error meaning from its surroundings. No new button tone, appearance, or parent-context prop is introduced.

Secondary uses an 8% context-ink veil at rest, 12% on hover, and 16% on press. Ghost starts transparent and uses the same hover/press veils. Labels blend 80% context ink with 20% theme primary ink so small action text remains readable as the plate deepens. The contour uses 28% context ink in Soft/Frost and 44% in Pixel (Soft's secondary perimeter remains absent). The theme owns these `--btn-context-*` recipes; ordinary theme shadows, press travel, timing, and geometry still apply. The status surface itself stays stationary.

Open and selected actions retain the existing Button state hierarchy with the contextual palette. Pending preserves the same plate, name, focus, and geometry. Disabled supporting actions use a 4% ink veil, 40% action ink, and a 12% contour; ghost remains transparent. The containing message stays fully readable. Focus is a separate 2px contour in the enclosing surface ink, including during hover or pending.

Inherited Code uses its own 8% status-ink veil and the status foreground, distinguishing the literal from its surrounding plate. A Link with `tone="inherit"` keeps the surface hue and gains the same stronger action ink on press. Its default underline strengthens on hover; the explicit no-underline mode uses stronger local ink for hover feedback. The contextual focus contour stays visible. The state study can switch all three underline modes. Close keeps its quieter inherited status ink. Inside a Button or Link, use `Code plate={false}` so it follows the actual control's foreground without adding a competing small plate.

The nearest painted surface owns the context. Transparent Text or Blockquote passes it through even when it changes its own text color. Card clears the outer action context and supplies neutral Code context. A theme boundary or a Base/Overlay surface boundary clears the outer action context; a nested Alert then establishes its own. After a nested surface ends, the outer context resumes. Custom painted surfaces can publish the same ink or clear it with `initial`.

Explicit accent/danger Buttons, primary neutral Buttons, and explicit Code tones retain their own palettes. This keeps action intent independent of the message's severity. All contextual behavior is automatic for ordinary supporting actions, while those explicit choices remain visible in the boundary study.

## Actions and recovery

Actions always sit **below** the description, aligned to the content column. The 4px content gap plus 8px action padding creates 12px clearance. Actions wrap in reading order with an 8px gap; labels wrap without overflow. Prefer at most two routine actions. Compact actions use S, including within M/L; actions in one row share their size. Recovery uses secondary/ghost neutral buttons. Danger tone means discarding/deleting, independent of message severity; do not invent warning/success button tones.

The application owns results. During retry the root retains its error meaning and explanation. Only retry waits, keeps its width and focus, and suppresses repeat activation; other useful actions remain available. Failure retains the error and restores retry; success replaces it with success or removes it when adjacent content proves the outcome. Unavailable actions use the shared Button disabled state with an adjacent explanation; the message stays readable. Essential unresolved errors should not offer dismissal.

The recovery preview holds pending until explicit **Simulate failure / Simulate success** controls are used. It does not run a fake network timer. Details expand in flow with focus retained on the trigger. Narrow buttons are layout samples, not application commands. Alert itself performs no retries, navigation, validation, or async work.

## Closing, focus, and motion

Close appears only with an owner-supplied callback and specific localized name. It occupies inline-end, aligned with the first text line. A real type=button never submits a surrounding form. Escape and clicks elsewhere do not dismiss it. There is no timer, entrance, or collapsing exit animation.

| Close state             | Appearance / outcome                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| Rest                    | Transparent plate, inherited ink                                            |
| Fine-pointer hover      | 12% current-ink veil on the close box only                                  |
| Press                   | 20% current-ink veil, stable geometry                                       |
| Keyboard focus          | 2px current-ink contour, 2px offset; combines with hover/press              |
| Enter / Space / pointer | Request dismissal; owner removes the message                                |
| Coarse pointer          | Reserve a real 44×44px column inside the surface, clear of copy and actions |

Feedback follows the theme's Button state duration: 120ms Soft/Frost, immediate Pixel. Reduced motion removes transitions. Forced colors retains system-color framing, readable glyphs/text, close feedback and focus. Copy and distinct shapes preserve meaning without color.

Arrival and content updates never take focus. After removing a focused control, the owner chooses the nearest logical next control: a form field or remaining page action. Pointer dismissal must not steal focus from a separate active field. Never focus a removed node. The live tip returns focus to **Show tip again** after dismissal. This is a local harness, not a universal focus engine.

## Announcement and static content

Visual severity and announcement urgency are separate. A page-load documentation warning should not interrupt reading. The prototype has no automatic live role. A static page notice demonstrates a named region with an actual heading. Dynamic recovery explicitly uses alert for failure and status for success.

The intended package default for newly inserted feedback is assertive for warning/danger, polite for neutral/info/success, with an explicit-role override. Static consumers choose ordinary document semantics or a named region. Reusable announcement lifecycle, deduplication, and actionable live-content compatibility are package engineering obligations, not guarantees proved here.

The [WAI-ARIA Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) informs the absence of automatic disappearance and focus changes on arrival. [Carbon notification guidance](https://www.carbondesignsystem.com/building-blocks/core/components/notification/guidelines) informs concise recovery copy and distinct status glyphs. Our family shares visual anatomy between static callouts and dynamic feedback.

## Narrow spaces, scaling, RTL, and nesting

Inspect 360/768/1280/1440px and 120% text in Workbench. Text and line height scale; spacing and glyphs keep their dimensions. Titles, paragraphs, URLs, and unbroken identifiers wrap without truncation, height clamps, or an internal scrollbar. Content grows the page or enclosing overlay scroll region. Lists use 1.25em logical indent. Isolate directional data with bdi; the Arabic sample supports RTL inspection. Its specimen-only Noto Sans Arabic 400/600 text subsets render deterministically offline; provenance and the shared Open Font License are in `public/assets/licenses/alert-arabic.txt`. Production hosts remain responsible for script coverage. Edge, icon, close, and action order follow inherited direction.

The overlay section paints real floating material over the shared underlay, then places Alert inside. A native inspector-field stand-in explicitly demonstrates proximity and focus: **Choose owner** focuses the field, and entering a value shows success. This is a minimal neighboring-control sample. Inspect application fit independently in the overview notice, document-reader warning, import validation summary, and inherited Code examples.

## Review route and handoff

| Section            | Design question                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------- |
| status             | All five meanings, material and ink hierarchy                                                |
| context            | All five status grounds with inherited Code, Link, close, secondary/ghost neutral actions    |
| context-states     | Every action state, selectable across five statuses, including IconButton and additive focus |
| context-boundaries | Transparent content, neutral Card, new overlay, explicit tones and unplated Code in a Button |
| context-overlay    | The same inherited content on a real floating material, selectable across five statuses      |
| sizes              | Complete five-status × three-size matrix                                                     |
| anatomy            | Optional slots, custom icon, Code, heading semantics, live dismissal                         |
| close              | Explicitly pinned hover/press/focus and S/M/L focus clearance                                |
| actions            | Pinned disabled, hover+focus, destructive press; readable message                            |
| recovery           | Pending action, failure/success, details, stable message                                     |
| overflow           | Narrow wrapping, long title/URL/identifier, list, RTL text                                   |
| overlay            | Floating material, field feedback and focus destination                                      |

Preserve approved geometry, materials, hierarchy, and outcomes during implementation. Establish exact React 19 types/refs, compound structure, slot emptiness, controlled visibility, announcements, localized names, and robust focus ownership in the package stage. Shared Button/Link mechanics stay with those components. Prove accessibility and native-form safety with appropriate tests; do not promote preview pins or helpers into public API.
