# Choice cards

Use [CheckboxCard](#checkboxcard) for independent options, [RadioCard](#radiocard) for one answer from a set, and [SwitchCard](#switchcard) for settings that apply immediately. Cards give each option room for a description, metadata, and its own secondary actions. Use a CheckboxCard for a setting saved with the rest of a form.

```tsx
import { CheckboxCard, CheckboxCardGroup, Link } from '@docouno/unica';
import '@docouno/unica/styles.css';

<form>
  <CheckboxCardGroup name="formats" aria-label="Export formats" defaultValue={['pdf']} required>
    <CheckboxCard
      value="pdf"
      label="PDF"
      description="Keep the print layout."
      metadata="Included"
      secondary={<Link href="/export-terms">Read export terms</Link>}
    />
    <CheckboxCard value="source" label="Source files" description="Keep the original attachments." />
  </CheckboxCardGroup>
  <button type="submit">Export</button>
</form>;
```

## Anatomy and appearance

| Prop or part | Contract |
| --- | --- |
| `label`, `description` | Visible title and optional explanation. The input uses the title as its accessible name unless you supply an ARIA name. The description is appended to `aria-describedby` alongside any IDs you provide. |
| `metadata`, `secondary` | Passive details such as a price or Badge, followed by independent links or buttons. Only the free card surface activates the input. Give each secondary action its own accessible name. |
| `children` | Compose `ChoiceCardContent`, `ChoiceCardLabel`, `ChoiceCardDescription`, `ChoiceCardMetadata`, and `ChoiceCardSecondary`. Supply your own label and description IDs. Choose either `children` or the four content props. |
| `indicatorPlacement` | `start`, `end`, or `none`. CheckboxCard and RadioCard default to `start`, SwitchCard to `end`. Use `none` with the matching `CheckboxCardIndicator`, `RadioCardIndicator`, or `SwitchCardIndicator` placed in the content. Keep one visible marker. |
| `size` | `s`, `m`, or `l`, default `m`. The marker aligns to the first title line. Every card wraps long text and keeps a target at least 44px high. Start and end follow writing direction. |
| `ref`, `id`, ARIA, events and form attributes | Belong to the one native input. The outer plate receives `className`, `style`, `hidden`, and `inert`. Groups and parts accept refs to their own DOM nodes. |

The active theme supplies the plate and selection colors through the `--choice-card-*` recipe. The same component adapts on an ancestor with `data-surface="overlay"`. Soft, Frost, and Pixel retain their own radii, including the circular Radio marker in Pixel. A keyboard-visible input focus covers the card perimeter. Secondary actions keep their own focus ring. Forced colors preserve the marker, disabled dash, and focus outline. Reduced motion removes plate transitions, thumb travel, and spinner rotation.

A compound option uses explicit IDs for its accessible name and description. The same links work in server HTML.

```tsx
import { useId } from 'react';
import {
  CheckboxCard,
  CheckboxCardIndicator,
  ChoiceCardContent,
  ChoiceCardDescription,
  ChoiceCardLabel,
  ChoiceCardSecondary,
  Flex,
  Link,
} from '@docouno/unica';

export function RetainOriginals() {
  const id = useId();
  return (
    <>
      <CheckboxCard
        name="retain"
        value="originals"
        indicatorPlacement="none"
        status="danger"
        aria-labelledby={id + '-title'}
        aria-describedby={id + '-help ' + id + '-error'}
      >
        <ChoiceCardContent>
          <Flex align="start" justify="space-between" gap={12}>
            <ChoiceCardLabel id={id + '-title'}>Retain originals</ChoiceCardLabel>
            <CheckboxCardIndicator />
          </Flex>
          <ChoiceCardDescription id={id + '-help'}>
            Keep the source attachments.
          </ChoiceCardDescription>
          <ChoiceCardSecondary>
            <Link href="/retention-terms">Read retention terms</Link>
          </ChoiceCardSecondary>
        </ChoiceCardContent>
      </CheckboxCard>
      <p id={id + '-error'}>Choose a retention period before enabling this option.</p>
    </>
  );
}
```

## CheckboxCard

A CheckboxCard works alone or as an option in either [CheckboxGroup](checkbox.md#checkboxgroup) or `CheckboxCardGroup`. Each available input and secondary action follows DOM Tab order. Space toggles the input. Enter follows the checkbox's native form behavior. Individual `required` requires that exact choice. `status="danger"` adds an invalid edge and sets `aria-invalid` on an enabled input. Associate the explanatory message with `aria-describedby`.

`CheckboxCardGroup` accepts the same props as CheckboxGroup and can contain compact Checkbox and CheckboxCard together. Use `value` or `defaultValue` and `onValueChange` for a shared set of keys. In a layout-only group, options can own their values. Group `required` means at least one available choice. Supply `requiredMessage` to customize the native validation message and show one shared error after a validation attempt.

## RadioCard

Use RadioCard in `RadioCardGroup` or [RadioGroup](radio.md#radiogroup). Each option needs a unique string `value`. An empty string is a valid key. The group accepts `value` or `defaultValue`, with `null` representing an unanswered group. It owns the options' `name`, form, required state, and read-only policy. Use `onValueChange(next)` to receive the proposed key. Give the group a visible heading via `aria-labelledby` or set `aria-label`.

Radio and RadioCard can share a group. Tab visits one primary input in the set as well as each independent secondary action in DOM order. Arrows move and select among available options. Home and End select the first and last available option. Repeating a selection keeps it selected. If a selected option becomes disabled, its marker stays selected and the next Tab entry is available. The disabled option is excluded from submission.

Set `disabled` or `hidden` when an option's availability changes. WebKit can skip the group's primary Tab stop after a viewport change hides the selected option through CSS alone.

```tsx
import { Radio, RadioCard, RadioCardGroup } from '@docouno/unica';

<RadioCardGroup name="visibility" aria-label="Visibility" defaultValue="private">
  <Radio value="private" label="Only me" />
  <RadioCard value="team" label="Workspace members" description="Share with everyone on your team." />
</RadioCardGroup>;
```

## SwitchCard

`SwitchCard` takes the [Switch](switch.md#switch) props and can share a [SwitchGroup](switch.md#switchgroup) with compact Switch controls. Space or a single Enter toggles the setting. Enter does not submit the form. Use `loading` to show a spinner in the current thumb position and block further toggles. The input keeps its focus and last accepted value. A disabled input suppresses the spinner. Use `thumbIcon` for optional decorative thumb content.

The application owns saving, the pending message, and retry. Keep `checked` on the last confirmed value while saving. Tie plain-language feedback to the input and announce it in one status region.

```tsx
import { useId, useState } from 'react';
import { SwitchCard } from '@docouno/unica';

export function ReviewReminders({ save }: { save: (enabled: boolean) => Promise<void> }) {
  const id = useId();
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function update(next: boolean) {
    setPending(true);
    setMessage(`Turning reminders ${next ? 'on' : 'off'}…`);
    try {
      await save(next);
      setEnabled(next);
      setMessage('Reminder setting saved.');
    } catch {
      setMessage('Could not save the setting. Toggle again to retry.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <SwitchCard
        label="Review reminders"
        name="reminders"
        checked={enabled}
        loading={pending}
        aria-describedby={id}
        onCheckedChange={(next) => void update(next)}
      />
      <p id={id} role="status">{message}</p>
    </>
  );
}
```

## Availability and form behavior

- An available checked input submits its name and value, with the native default value `on`. Read-only inputs keep their value and focus. Disabled inputs, including those in a disabled fieldset outside its first legend, are skipped by Tab and FormData. Give useful information links a separate target so they can remain available. Native fieldset rules still apply to buttons and other form controls.
- Use `inert` on the card or an ancestor to block both the input and its secondary actions. Inert leaves a previously checked successful input in FormData.
- An uncontrolled choice returns to its initial default on native form reset. A controlled choice retains the value its owner last accepted. Use `onCheckedChange(next)` or the group's `onValueChange(next)` to accept changes. Native `onChange` still receives the React event. During a controlled proposal, the input can already reflect the last accepted value. A reset emits no choice callback.
- A managed or required checkbox group and every radio group share a native form owner. Pass `form` on the group for an external form. A layout-only checkbox or switch group also allows item-level form association. See [Overlays and Forms](../concepts/overlays-and-forms.md) for ownership and reset details.
