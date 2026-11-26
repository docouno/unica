# FormField

Use `FormField` to give an editor or group a visible name, persistent instructions, validation feedback, and an optional count. Load `@docouno/unica/styles.css` once with your application styles.

```tsx
import { FormField, Input } from '@docouno/unica';

export function BillingEmail() {
  return (
    <form>
      <FormField
        label="Billing email"
        required
        description="This address receives invoices."
        status="danger"
        message="Enter the full address, such as billing@example.com."
      >
        <Input name="email" type="email" defaultValue="billing@" />
      </FormField>
      <button type="submit">Save</button>
    </form>
  );
}
```

## Props and parts

| Prop | Default | Purpose |
| --- | --- | --- |
| `target` | `'control'` | Bind a single control or a group. Use `'group'` for a set of choices or independently named editors. |
| `label`, `optional`, `labelAction` | Omitted | Visible name, optional annotation, and a separate action. The required marker takes priority over optional copy. |
| `controlId`, `labelId` | Generated | Override the single control or label ID. The native `id` prop names the wrapper itself. |
| `size` | `'m'` | Label density and default control size. Accepts `s`, `m`, and `l`. |
| `orientation` | `'vertical'` | Use `horizontal` for a shared label column. Labels stack below 30rem of available field width. |
| `labelAlign` | `'control'` | Align the label's first line with the control. Use `text` for a Textarea's first text row or `start` for a composite or tall group. |
| `status` | `'neutral'` | One of `neutral`, `info`, `success`, `warning`, or `danger`. Only danger expresses invalidity. |
| `description`, `message`, `counter` | Omitted | Persistent instructions, current feedback, and an application-supplied count or limit. |
| `statusLabel` | Built-in copy | Localize the fallback for a non-neutral status. |
| `feedbackIcon` | `true` | Allow a glyph in the message row when the bound text editor cannot show the matching glyph. Set false when an inner editor owns a composite error. |
| `reserveMessage` | `false` | Reserve a minimum of one support line. An empty reservation has no accessible message. |
| `disabled`, `readOnly`, `required` | `false` | Defaults for controls that support each state. Disabling the field hides its message and subdues the label. |

Content props accept React nodes. Whitespace, booleans, and empty arrays and fragments count as absent. A custom element counts as supplied even if it later renders nothing. Pass `null` to omit it conditionally. Non-neutral status supplies fallback copy when the message is absent. Use `message=""` to suppress the row explicitly. A count of zero is valid content. The count may wrap below an adjacent message on narrow fields.

Server-rendered fields show the glyph beside the feedback until the editor mounts. A visible Input, Textarea, [NumberInput](number-input.md), or Select trigger with the matching status then owns the glyph.

`FormField` accepts native div props and `Ref<HTMLDivElement>`. The standalone parts accept their own native props and React 19 refs.

| Part | Element | Additional props |
| --- | --- | --- |
| `FormFieldLabel` | `label`, or `span` with `target="group"` | `required`, `optional`. Use `htmlFor` on the native label. |
| `FormFieldDescription` | `div` | Pass the instruction as children and associate its ID with the recipient. |
| `FormFieldFeedback` | `div` when there is feedback | `status`, `statusLabel`, and `icon`. The message is its children. |

Horizontal rows use a 1:2 column ratio and 24px column gap. Set the inherited `--form-field-label-width` hook to a bounded track, such as `minmax(0, 10rem)`, to align adjacent rows. The control owns its material and focus indication on Base and Overlay. Field layout follows the writing direction and the theme's typography.

## Names, descriptions, and forms

The field associates its label before hydration. For a single control, use `controlId` on FormField for a specific ID. A conflicting child ID triggers a development warning and the field ID takes precedence. The control keeps its own ref, native events, `name`, form owner, and value. Explicit control props take precedence over inherited state, including `false` and `'neutral'`.

The accessible description lists the author's IDs first, followed by instructions, message, and count, with duplicates removed. Disabling an editor removes its invalid state and field message reference. The external message remains visible until FormField itself is disabled. Read-only text can still be focused, selected, and copied with its existing feedback. A disabled native fieldset applies the browser's first-legend exception. After hydration, supported controls use their effective native availability for the message association.

Clicking a label activates or focuses its bound editor using native behavior. A group heading has no activation behavior. Put help actions in `labelAction` so they have their own tab stop. During validation, keep entered values and have the form focus the first field that needs attention. FormField shows application feedback. Submitting, resetting, and validating values use the controls' native form behavior. The application owns validation timing and live announcements.

### Groups

```tsx
import { Checkbox, CheckboxGroup, FormField } from '@docouno/unica';

export function DeliveryMethods({ missing }: { missing: boolean }) {
  return (
    <FormField
      target="group"
      label="Delivery methods"
      description="Choose one or both."
      required
      status={missing ? 'danger' : 'neutral'}
      message={missing ? 'Select a delivery method.' : undefined}
    >
      <CheckboxGroup name="delivery" requiredMessage="Select a delivery method.">
        <Checkbox value="email" label="Email digest" />
        <Checkbox value="app" label="In-app notification" />
      </CheckboxGroup>
    </FormField>
  );
}
```

The group receives the shared name, description, and validation. Each option keeps its own name and ID. A required CheckboxGroup or CheckboxCardGroup validates a minimum selection. RadioGroup, RadioCardGroup, and SegmentedControl inherit required choice. For SegmentedControl, pass an explicit `labelId` and the same `aria-labelledby` to satisfy its naming contract. Switch and SwitchGroup inherit availability and size and can reference feedback. Slider and RangeSlider inherit supported state. RangeSlider associates the shared instructions with its group and its separately named thumbs. The group receives the shared message.

### Custom controls and composite editors

Use `useFormField()` inside an adapter to read the nearest scope, or `null` outside a field. It returns a readonly `FormFieldContextValue` discriminated by `target`. Only the `control` branch has `controlId`. IDs for absent content are undefined. `FormFieldContext` is available for integrations that need to supply or isolate a scope. For a custom single editor, spread its native attributes and apply the scope's control ID, supported defaults, and description IDs to the actual focus target. Raw HTML elements are associated by the author, as in this composite example.

```tsx
import { FormField, useFormField } from '@docouno/unica';

function TimeEditors({ endInvalid }: { endInvalid: boolean }) {
  const field = useFormField();
  return (
    <div
      role="group"
      aria-labelledby={field?.labelId}
      aria-describedby={field?.descriptionId}
    >
      <label>Start <input name="start" type="time" /></label>
      <label>
        End
        <input
          name="end"
          type="time"
          aria-invalid={endInvalid || undefined}
          aria-describedby={endInvalid ? field?.messageId : undefined}
        />
      </label>
    </div>
  );
}

export function ReviewWindow({ endInvalid }: { endInvalid: boolean }) {
  return (
    <FormField
      target="group"
      label="Review window"
      description="Use local time."
      status={endInvalid ? 'danger' : 'neutral'}
      message={endInvalid ? 'Choose a later end time.' : undefined}
    >
      <TimeEditors endInvalid={endInvalid} />
    </FormField>
  );
}
```

When an error concerns the relationship between valid values, put `aria-invalid` and the message reference on the group. A native `fieldset` can instead name itself with its first `legend`. Keep one visible heading. Nested FormField instances establish independent scopes.

The runtime parts and hook belong in client modules when using React Server Components. The server entry also exposes their TypeScript types.
