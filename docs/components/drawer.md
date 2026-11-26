# Drawer

Use Drawer for modal filters, settings, or details that belong at the edge of the workspace. Use the application layout for a permanent inspector and Modal for a centered decision or editor. [Modal](modal.md)

```tsx
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ExportDetails({ fileName }: { fileName: string }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">Export details</Button>
      </DrawerTrigger>
      <DrawerContent side={{ narrow: 'bottom', wide: 'end' }} width="s" dismissOnBackdrop>
        <DrawerHeader>
          <div>
            <DrawerTitle>Export details</DrawerTitle>
            <DrawerDescription>The latest export is ready.</DrawerDescription>
          </div>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <dl>
            <dt>File name</dt>
            <dd>{fileName}</dd>
          </dl>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
```

## Parts and props

| Part | Props and DOM |
| --- | --- |
| `Drawer` | Groups one Content and any number of Triggers without adding a DOM element. `defaultOpen` starts uncontrolled state and defaults to `false`. Use `open` with `onOpenChange(open)` for controlled state. The root ref points to the Content dialog. |
| `DrawerTrigger` | A native `button` with `type="button"`. `asChild` composes one interactive element that forwards props and its DOM ref. The trigger reports the dialog's actual expanded state. |
| `DrawerContent` | A native `<dialog>` with dialog semantics. `size` controls density and `width` sets the width ceiling. Both accept `s`, `m` (default), and `l`. `side` accepts `start`, `end` (default), `top`, `bottom`, or `{ narrow, wide }`. `swipeToClose` defaults to `true` and applies on the resolved `bottom` side. `dismissOnBackdrop` defaults to `false`. `initialFocus` and `returnFocus` take element refs. |
| `DrawerHeader` | A `header` for the visible title, optional description, and Close. |
| `DrawerTitle` | An `h2` that supplies the default dialog name and initial focus target. |
| `DrawerDescription` | A `p` for a short optional explanation. |
| `DrawerBody` | A `div` for content and native scrolling. |
| `DrawerFooter` | A `footer` for optional actions. Actions align at inline end and wrap in source order. |
| `DrawerClose` | A native `button` with `type="button"`. By default it renders a small neutral ghost `IconButton` named “Close drawer.” Localize it with `aria-label`. Supply children for a visible label or use `asChild` with a `Button`. |

All refs are ordinary React 19 props. The package root exports each part's `*Props` type, `DrawerSize`, `DrawerWidth`, `DrawerSide`, and `DrawerResponsiveSide`. Content forwards dialog attributes such as `id`, `className`, `style`, and ARIA naming props.

## Placement and scrolling

Start and end fill the available height with square corners. Inline placement, the free-edge rim, and the directional shadow mirror in RTL. Top and bottom center along the inline axis and grow with their content. They leave at least 16px at the opposite edge. The attached corners are square and the free corners use the theme radius. The panel meets its attached edge and the content respects safe areas.

An adaptive `{ narrow, wide }` pair applies `narrow` at 600px or less in the dialog's viewport. Above 600px it applies `wide`. The panel and its fields stay mounted when the side changes. The shared width ceilings are 24/36/52rem and the density scale is independent. [Modal layout and material](modal.md#layout-and-material)

Place Header, Body, and Footer directly in Content. Body normally scrolls with Header and Footer kept in view. At less than 96px of available reading space, when the content needs more room, scrolling moves to the whole panel. Both scroll owners use the compact native recipe. Scroll seams indicate hidden content while Body scrolls and disappear in the whole-panel layout. The current scroll owner is keyboard reachable. [Native Scrollbars](scrollbar.md)

Header aligns the default Close with the title's first line and the content's inline-end edge. Close uses the same pointer targets and focus clearance as Modal. [Modal parts and props](modal.md#parts-and-props)

## Focus and dismissal

Focus starts at the visible Title by default. The browser contains keyboard navigation in the active dialog. Escape closes the topmost nested popup first, then requests closing the Drawer. Close, opt-in backdrop dismissal, and an accepted swipe all use the same `onOpenChange(false)` request. With controlled `open`, keep it `true` to retain the panel and its draft. For confirmation, render a child Modal and set `role="alertdialog"` on its Content. [Focus and dismissal](modal.md#focus-and-dismissal) · [Protecting a draft](modal.md#protecting-a-draft)

On a bottom sheet, the 96 × 44px grip is the drag origin. The sheet follows a downward drag, leaving the body available for ordinary selection and scrolling. Release requests closing after 30% of the sheet's height, capped at 120px. A fast release can request closing after 32px at an average of at least 0.55px/ms. Short, canceled, or refused gestures settle back in 160ms. Use `swipeToClose={false}` to remove the grip. Include a visible Close action for both pointer and keyboard access.

Drawer enters from its attached edge over 200ms and the scrim fades in over 150ms. Closing releases modality and restores focus immediately. Reduced motion removes entry and settling animations while preserving direct drag. Forced colors uses system colors for the boundary, grip, and focus indicators.

## Forms and portal hosts

Place a form inside Body and associate footer submitters by `form={id}`. Form, fields, and submitter share one DOM tree. Drawer's native dialog uses the configured portal host, and nested portals inherit the dialog as their host. A dialog inside an iframe blocks its own document. [Forms and portal hosts](modal.md#forms-and-portal-hosts)

Open `/?item=drawer` in the playground for each edge, adaptive placement, form scrolling, and gestures. [Folio Page Properties & Relations](../compositions/folio.md#explore-the-live-compositions)
