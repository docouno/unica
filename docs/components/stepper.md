# Stepper

Stepper presents a short, ordered process such as setup or an import. Each stage can carry a description, a completion flag, and a correction. The application renders the active stage's content and owns progression, validation, and results.

## Controlled process

```tsx
import { useState } from 'react';
import { Stepper, StepperStep } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function WorkspaceSetup() {
  const [stage, setStage] = useState<string | null>('access');

  return (
    <Stepper aria-label="Workspace setup" value={stage} allowReturn onValueChange={setStage}>
      <StepperStep value="details" label="Details" completed />
      <StepperStep value="access" label="Access rules" description="Choose a workspace owner." />
      <StepperStep value="review" label="Review setup" />
    </Stepper>
  );
}
```

In controlled mode, `onValueChange` requests a new current stage. The owner can accept immediately, accept later, or leave the current stage in place. Set `allowReturn` and pass a handler to enable controlled step actions. Omit `allowReturn` to show a passive map, including when a handler is present.

## Local position

```tsx
import { Stepper, StepperStep } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ImportStages() {
  return (
    <Stepper aria-label="Import stages" defaultValue="verify" allowReturn>
      <StepperStep value="source" label="Source" completed />
      <StepperStep value="verify" label="Verify" />
      <StepperStep value="commit" label="Commit" status="danger" message="Choose a destination." />
    </Stepper>
  );
}
```

With `value` omitted, Stepper starts from `defaultValue` and accepts an available action itself. An optional listener receives the new value. External changes to `defaultValue` after mount leave the current position in place.

## API

| Stepper prop | Contract |
| --- | --- |
| `aria-label`, `aria-labelledby` | Supply at least one name for the process. A referenced label takes precedence. |
| `children` | Ordered `StepperStep` declarations, including arrays and fragments. Empty conditional children are skipped. |
| `value`, `defaultValue` | Stage key or `null`. An explicit `value` controls position. An unmatched key or `null` leaves the map without a current stage. The local initial value defaults to `null`. |
| `allowReturn` | Defaults to `false`. Enables actions on completed stages and stages needing attention, except the current stage. |
| `onValueChange` | `(value: string) => void`. Fires for an activation request, with the stage key. |
| `layout` | `responsive` (default), `horizontal`, `vertical`, or `compact`. Responsive uses the horizontal map at 36em of the map's Body S font size and above. Below it, the map condenses to a segmented summary. Horizontal gaps contract when the steps need the room for markers or touch targets. |
| `size` | `s`, `m` (default), or `l`. Markers are 24, 32, or 40 px. |
| `messages` | Partial overrides for generated visible and accessible text. |
| `ref` | React ref to the group's `HTMLDivElement`. |

| StepperStep prop | Contract |
| --- | --- |
| `value` | Unique, stable, nonempty string. Use it as the React key when mapping an array. |
| `label`, `description` | Required short text title and optional supporting text. |
| `completed` | App-supplied completion flag. Preserved when the stage becomes current or returns to neutral after correction. |
| `status`, `message` | `neutral` (default) or `danger`, with optional corrective text. A danger stage is excluded from the completion count. Without a message it shows “Needs attention.” |
| `ref` | React ref to the stage's `HTMLLIElement`, including while the list is collapsed. |

Both parts accept `id`, `className`, `style`, `lang`, `dir`, and consumer `data-*` attributes. Stepper also accepts `aria-describedby`. Step-level language and direction apply to its authored text. Markers and connectors follow the direction of the group. An empty map renders nothing. Invalid declarations are skipped and the first valid declaration for each value wins.

### Messages

Supply as many overrides as needed. Each callback returns a complete localized string and runs in server and client rendering. The arguments include the original author text. Keep the original text as a distinct insertion to preserve its language and direction. For an ambiguous insertion, surround it with Unicode FSI and PDI marks.

| Key | English example |
| --- | --- |
| `allSteps` | All steps |
| `allComplete` | All steps complete |
| `markerNumber(index)` | 2 |
| `position(index, total)` | Step 2 of 3 |
| `completedCount(count, total)` | 1 of 3 steps complete |
| `stepLabel(index, label, completed)` | Step 1: Source, completed |
| `needsAttention(message?)` | Needs attention: Choose a destination. |
| `checkStep(label)` | Check Commit |

Indices count from one in the rendered order. The compact summary shows the current stage and names any other stages needing attention. When no stage is current, it shows the completion count or the all-complete message.

## Keyboard and forms

The named group has one readable projection. The visible list or compact heading carries the current step. In passive mode the map has zero Tab stops. With return enabled, use Tab and Shift+Tab to reach available actions and Enter or Space to activate them. The compact disclosure expands the same ordered list in place.

When the focused step accepts a keyboard request, focus moves from its action to the stage itself. A resize keeps focus inside the visible list by unfolding the map when the disclosure is available. A passive summary can temporarily receive focus during reflow. When its summary or disclosure disappears on expansion, the full map receives focus on the current stage, first available action, or list. The application controls focus when it moves or explicitly releases it.

Stepper buttons use `type="button"` and honor a disabled fieldset. The map contributes no fields to FormData, and form reset leaves its position and disclosure as they were. The same in-flow markup works on the page or inside an overlay.
