# Modal

Use Modal for a focused editor, a read-only inspection, or a decision that blocks the current workspace. The centered panel opens as a native `<dialog>` in the browser's top layer. Use Drawer when the task belongs at an edge of the workspace. [Drawer](drawer.md)

```tsx
import { useId, useRef, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function RenameProject({
  name,
  onRename,
}: {
  name: string;
  onRename: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const nameField = useRef<HTMLInputElement>(null);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button variant="secondary">Rename project</Button>
      </ModalTrigger>
      <ModalContent width="s" initialFocus={nameField}>
        <ModalHeader>
          <div>
            <ModalTitle>Rename project</ModalTitle>
            <ModalDescription>The name appears in the workspace directory.</ModalDescription>
          </div>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              onRename(String(data.get('name')));
              setOpen(false);
            }}
          >
            <Input ref={nameField} aria-label="Project name" name="name" defaultValue={name} required />
          </form>
        </ModalBody>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="secondary" tone="neutral">Cancel</Button>
          </ModalClose>
          <Button type="submit" form={formId}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

## Parts and props

| Part | Props and DOM |
| --- | --- |
| `Modal` | Groups one Content and any number of Triggers without adding a DOM element. `defaultOpen` starts uncontrolled state and defaults to `false`. Use `open` with `onOpenChange(open)` for controlled state. The root ref points to the Content dialog. |
| `ModalTrigger` | A native `button` with `type="button"`. `asChild` composes one interactive element that forwards props and its DOM ref. Disabled activation and clicks canceled with `preventDefault()` leave the dialog unchanged. The trigger reports the dialog's actual expanded state. |
| `ModalContent` | The native `<dialog>`. Accepts `id`, `className`, `style`, and ARIA naming props. `role` is `dialog` (default) or `alertdialog`. `size` sets density and `width` sets the width ceiling. Both accept `s`, `m` (default), and `l`. `initialFocus` and `returnFocus` take element refs. `dismissOnBackdrop` defaults to `false`. |
| `ModalHeader` | A `header` for the visible title, optional description, and Close. |
| `ModalTitle` | An `h2` that supplies the default dialog name and initial focus target. |
| `ModalDescription` | A `p` for a short optional explanation. |
| `ModalBody` | A `div` for content and native scrolling. |
| `ModalFooter` | A `footer` for optional actions. Actions align at inline end and wrap in source order. |
| `ModalClose` | A native `button` with `type="button"`. By default it renders a small neutral ghost `IconButton` named “Close dialog.” Localize it with `aria-label`. Supply children for a visible label or use `asChild` with a `Button`. |

All refs are ordinary React 19 props. The package root exports each part's `*Props` type, `ModalSize`, and `ModalWidth`.

Place Header, Body, and Footer directly in Content. Put Close in Header for an editor or inspection. In an alert dialog, put the safe action first in the footer and pass its ref to `initialFocus`. `aria-labelledby` or `aria-label` can supply an explicit name. Without either, the dialog uses its mounted Title. `aria-describedby` can supply an explicit description, otherwise the dialog uses its mounted Description. Put long instructions or other structured content in Body.

The default Close in Header centers its glyph on the title's first line. The glyph frame follows the content's inline-end edge, with room for the focus outline on narrow touch layouts. The shared `IconButton` target is 30 × 30px and expands to 44 × 44px for coarse pointers.

## Focus and dismissal

| Interaction | Result |
| --- | --- |
| Opening | Focus starts at Title, with a static target inside the panel as a fallback. For a short editor, `initialFocus` can target the first meaningful field. Touch opening starts reading at the title or static target when `initialFocus` points to an editable field. A safe button can receive focus on any input modality. |
| Tab and Shift+Tab | Follow the active dialog's tab order. The browser makes the rest of the document inert. |
| Escape | Closes the topmost nested popup or submenu first. Once those layers close, Escape requests closing the dialog. Active text composition keeps its Escape handling. |
| Close action or native cancel | Requests closing through `onOpenChange(false)`. |
| Backdrop | Leaves the dialog open by default. With `dismissOnBackdrop`, a primary press and release from the same pointer on the backdrop requests closing. |
| Accepted close | Releases the dialog immediately. Focus returns to the available `returnFocus` target, the actual invoking trigger, or the previously focused control, in that order. An intentional focus move during closing takes precedence. |

In controlled mode, a request leaves the dialog in place until the owner changes `open`. A prop change applies directly without another `onOpenChange` call. On the server and during initial hydration, the Content portal waits for its host. While a host is mounted, Root and Content refs point to the same dialog before and between openings. Accepted closing unmounts the dialog's children, so keep saved state above Content.

### Protecting a draft

Render a controlled child `Modal` inside the editor's `ModalContent` or `DrawerContent`. Give the child `role="alertdialog"` on its Content, a visible title, and a safe **Keep editing** action with `initialFocus`. Keep the parent open while the confirmation is visible.

```tsx
function handleEditorOpenChange(next: boolean) {
  const dialog = editorDialog.current;
  if (!next && dirty && dialog?.isConnected && dialog.matches(':modal')) {
    setConfirmOpen(true);
    return;
  }
  setConfirmOpen(false);
  setEditorOpen(next);
}
```

Here `editorDialog` is the ref passed to the editor's Content. While the child is open, the editor stays mounted and its inputs, selection, and scroll position are preserved. **Keep editing** or Escape closes the child and returns to the editor. Use the child's `returnFocus` to choose a specific control in the editor. **Discard** resets application draft state and sets both controlled `open` values to `false`.

A direct `dialog.close()`, an accepted `<form method="dialog">` submission, or external removal of the mounted host can end the native opening before `onOpenChange(false)` runs. In that case the same handler accepts the completed close. If the owner still holds `open={true}`, reopening requires a new `false` → `true` transition.

## Layout and material

| Value | `width` ceiling | `size` insets | `size` section gap |
| --- | --- | --- | --- |
| `s` | 24rem | 16px | 12px |
| `m` | 36rem | 24px | 16px |
| `l` | 52rem | 32px | 24px |

Modal leaves 16px of viewport clearance, with 12px inline on narrow viewports. It respects safe areas. At 600px or less, medium and large insets and the large section gap use 16px. A nested alert dialog gets 8px of additional clearance on each inline side at 420px or less. Theme tokens supply the surface, radius, and scrim. Descendant fields and cards adapt to the overlay context automatically. [Themes and Roles](../concepts/themes-and-roles.md#overlay-surface-utility)

Body normally owns the [compact native scrollbar](scrollbar.md), inset 4px from the panel edges and the adjacent header and footer. A seam appears where more content is hidden. When the available reading area is below 96px and the content needs more room, the whole panel scrolls and the seams disappear. The scroll owner is keyboard reachable. The panel and backdrop fade in for 160ms and 150ms respectively. Reduced motion removes the fade. Forced colors uses system colors for the boundary and focus indicators.

## Forms and portal hosts

Place a native form in Body. A submit button in Footer can refer to that form by `form={id}`. Fields participate in native validation, `FormData`, and reset while mounted. Trigger and Close use `type="button"`. Keep the form, fields, and submitter in the same DOM tree for `form` associations, including when using a ShadowRoot or an iframe.

Content uses [Portal](portal.md). Set `UnicaProvider portalContainer` inside the theme and direction your dialog should inherit. Descendant portals default to the mounted dialog, which keeps nested interactive overlays inside its native focus boundary. When opening from a Popover command, keep the modal's Root and Content outside the Popover's dismissible content. Put the visible command trigger or its logical successor in `returnFocus`. The modal's native inertness and scroll lock apply to the document that contains the portal host. [Overlays and Forms](../concepts/overlays-and-forms.md)

Open `/?item=modal` in the playground for editors, nested confirmation, and read-only inspection. [Folio Invite & Access](../compositions/folio.md#explore-the-live-compositions)
