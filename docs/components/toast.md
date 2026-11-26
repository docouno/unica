# Toast

Toast reports an operation result while the user continues working. Keep the file, change, or recovery path available in the application. Use a persistent [Alert](alert.md) for section-level feedback and [FormField](form-field.md) for input errors.

## Quick start

Mount one viewport for each queue. Both dispatch and viewport use the closest ToastProvider. ToastProvider can sit above your router, and the viewport can sit wherever the application establishes its portal scope.

```tsx
import { Button, ToastProvider, ToastViewport, useToast } from '@docouno/unica';

function ExportButton({
  prepare,
  recordOutcome,
}: {
  prepare: () => Promise<void>;
  recordOutcome: (result: 'ready' | 'failed') => void;
}) {
  const toast = useToast();

  async function prepareExport() {
    const id = toast.show({ title: 'Preparing export', loading: true });
    try {
      await prepare();
      recordOutcome('ready');
      if (id !== null) toast.update(id, { title: 'Export ready', status: 'success', loading: false });
    } catch {
      recordOutcome('failed');
      if (id !== null) {
        toast.update(id, {
          title: 'Export failed',
          status: 'danger',
          loading: false,
          action: { label: 'Retry', onClick: () => void retry(id) },
        });
      }
    }
  }

  async function retry(id: NonNullable<ReturnType<typeof toast.show>>) {
    toast.update(id, {
      title: 'Retrying export',
      action: { label: 'Retry', pending: true, onClick: () => void retry(id) },
    });
    try {
      await prepare();
      recordOutcome('ready');
      toast.update(id, { title: 'Export ready', status: 'success', action: undefined });
    } catch {
      recordOutcome('failed');
      toast.update(id, {
        title: 'Export failed',
        action: { label: 'Retry', onClick: () => void retry(id) },
      });
    }
  }

  return <Button onClick={() => void prepareExport()}>Prepare export</Button>;
}

export function ExportFeedback(props: React.ComponentProps<typeof ExportButton>) {
  return (
    <ToastProvider>
      <ExportButton {...props} />
      <ToastViewport />
    </ToastProvider>
  );
}
```

If the export started before the view mounted, seed its already known state quietly. The next meaningful update is announced as usual.

```tsx
const id = toast.show({ title: 'Preparing export', loading: true }, { announce: false });
if (id !== null) toast.update(id, { title: 'Export ready', loading: false, status: 'success' });
```

A standalone card participates in normal layout. It is passive feedback whose visibility is controlled by the application.

```tsx
import { Toast } from '@docouno/unica';

<Toast title="Archive is available" status="info" onDismiss={hideNotice}>
  The archive includes <bdi>release-notes.md</bdi>.
</Toast>;
```

## API

| Entry | Contract |
| --- | --- |
| `Toast` | Required, non-blank `title`. Optional `children` with passive detail, `status`, `loading`, `action`, `actionLayout`, `onDismiss` and `dismissLabel`. Supports `id`, `className`, `style`, `lang`, `dir`, data attributes, and a div ref. Supplies its own accessible name and state description. |
| `ToastProvider` | Owns one queue per mount. Accepts `children`, optional `messages: Partial<ToastMessages>` and `ref: Ref<ToastStore>`. Nested providers own independent queues. |
| `useToast()` | Returns the nearest provider's stable `ToastStore` commands. |
| `ToastViewport` | Projects the nearest queue. Accepts `placement`, `fallbackFocusRef`, `id`, `className`, `style`, consumer data attributes and a ref to the live div. The ref is empty while there's no carrier. |

`ToastStatus` is `neutral` (default), `info`, `success`, `warning` or `danger`. The theme controls the material. `loading` uses a neutral activity glyph. A `ToastAction` has a non-blank `label`, `onClick`, optional native `disabled`, and optional `pending` to suppress repeat activation while keeping the button focusable. `actionLayout="auto"` fits short copy and an action on one line. Detail text, a long label, or `"below"` puts the action on its own row.

| Command | Result |
| --- | --- |
| `show(options, command?)` | Returns an opaque `ToastId`. Every call creates a separate notification unless its optional `operationKey` matches a live entry in this queue. A live match replaces its options in place and returns the same ID. |
| `update(id, patch, command?)` | Updates a live notification and returns `true`. Omitted fields stay as they were. Explicit `undefined` clears optional fields such as `action` and `description`. A supplied title must be non-blank. The result is `false` when the ID no longer belongs to a live entry in this queue. |
| `dismiss(id)` | Removes one live notification and reports whether the ID was present. |
| `dismissAll()` | Removes all live notifications owned by this provider. |

`ToastOptions` takes `title`, a string `description`, the card options `status`, `loading`, `action` and `actionLayout`, plus `operationKey`, `persistent` and `urgency` (`polite` by default or `assertive`). `ToastUpdate` accepts all mutable options. `ToastCommandOptions` accepts `announce: false` for a single show or update.

Each provider accepts up to 100 live notifications. At capacity, `show` returns `null` for a new entry and preserves all accepted actions. Keep the operation result in the application as in the example. Updates and dismissals remain available. Dismissal hides feedback. The application owns the ongoing operation.

## Reading and interaction

- New results leave keyboard focus in place. Tab and Shift+Tab reach the list and its native actions. Enter and Space activate a focused button. With two or more messages, the chevron toggles the list and Dismiss all clears the queue. Escape and outside presses leave Toast available.
- Closing the focused card moves focus through the remaining controls. When the queue empties, focus returns to the original control if available, then to the viewport's optional `fallbackFocusRef`. The application can move focus to the result from its action handler.
- A non-persistent neutral, info, or success update without an action uses six seconds of available reading time. Hover, focus inside, an inactive or hidden document, an unavailable host, and text hidden by the list pause that time. A warning, danger, loading state, persistent message, or message with an action waits for dismissal or update.
- A meaningful queue change sends its state, title and description to a separate live region. Only explicit `urgency="assertive"` uses the alert channel. Independent operations with identical text can each be announced. Reopening the list or transferring the viewport preserves delivered announcements. Standalone Toast supplies ordinary reading semantics.
- Translate `ToastMessages` to customize region, list and action group names, `dismissAll` text, `dismiss(title)`, `dismissAllLabel(count)`, `expand(count)`, `collapse(count)`, `summary(count, hiddenIssues)` and `stateLabel(status, loading)`. Supply message content in the application.
- Toast's controls are `type="button"`; they leave native form submissions, resets and FormData to the form's own controls.

## Placement and modal scope

Placement combines `top` or `bottom` with `start`, `center` or `end`. It defaults to `bottom-end`. Start and end follow the current writing direction. Use distinct placements when multiple providers share visible space.

The viewport is a manual popover in the nearest Unica portal scope. The document-wide queue moves into the topmost active Unica dialog. A scoped queue follows a dialog inside its scope, uses its own local host inside that dialog, or waits while a dialog in a separate scope is active. For a third-party native dialog, set `UnicaProvider.portalContainer` to the open dialog and restore the ordinary host when it closes. Keep ToastProvider and ToastViewport mounted across those changes.

A page queue and a dialog-specific queue can stay interactive at the same time. In the Workbench's Toast composition, prepare an export and a text preview, then try **View export** and **Read preview**. The page's export queue uses `bottom-end` and the dialog's preview queue uses `top-start`. Each viewport uses the commands from its own provider. The dialog-specific queue waits while the dialog is closed.

The viewport accounts for the visible viewport and the focused editor when available space changes. The expanded list uses native scrolling, with sticky rows where supported and ordinary scrolling in reduced motion and forced colors.
