# Feedback, Validation, and Form Field Ownership

Unica separates semantic color intent, form-field labeling, and application feedback into deterministic contracts so every control and screen communicates state consistently across `Soft`, `Frost`, and `Pixel`.

## Three Semantic Color Axes (`status` vs `tone` vs `color`)

Components never mix these three axes:

| Axis | Meaning | Components |
| --- | --- | --- |
| **`status`** | System state, severity, or validation (`info \| success \| warning \| danger` + `neutral`, plus `accent` on markers/progress and `inherit` on `Code`) | `Badge`, `Indicator`, `Progress`, `Blockquote`, `Code`, `Tag`, `Alert`, `Toast`, `FormField`, framed fields, and binary/range controls |
| **`tone`** | Non-status action intent or chrome emphasis (**never** accepts `info \| success \| warning`) | `Button`, `IconButton` (`accent \| neutral \| danger`), `Link` (`accent \| neutral \| inherit`), `Spinner`, `ProgressCircle` (`inherit \| neutral \| muted \| accent`) |
| **`color`** | Direct typographic or glyph foreground (`primary \| secondary \| muted \| subtle \| disabled \| inherit` + semantic hues) | `Text`, `Title`, `Icon`, `EmptyMedia` |

### Validation Status & Slots

- **Framed fields and `FormField`:** `FieldStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger'` (default `'neutral'`). Reserve `info` and `success` for asynchronous verification outcomes (such as slug availability or token checks), `warning` for non-blocking advisories, and `danger` for blocking validation failures.
- **Discrete and range controls** (`Checkbox`, `Radio`, `CheckboxCard`, `RadioCard`, `Slider`, `RangeSlider`, `SegmentedControl`, `ChipGroup`, `Dropzone`): `ControlStatus = 'neutral' | 'danger'`.
- **Immediate switches** (`Switch`, `SwitchCard`): **zero `status` prop**. A switch performs an immediate toggle; failed persistence belongs in application feedback.
- **Validation status** sets `aria-invalid="true"` on an available control or group with `status="danger"`. Read-only values can still show this state and explain why a locked value needs attention.
- **Unified supporting slots:** `description` holds persistent instructions and `message` holds validation/status feedback. Controls do not introduce `invalid`, `error`, `errorMessage`, `initialError`, or `issue`.

## Four Feedback Channels

Choose one channel based on scope and lifecycle:

1. **Field or group validation** → `FormField` (`status` + `message`), paired with the affected control's own frame/indicator.
2. **Operation result, background job, or generic async failure** → `Toast` (deduplicated by `id`, exposed via polite `status` or assertive `alert` regions without interrupting focus).
3. **Persistent contextual warning for a section/page or form submit summary** → [Alert](../components/alert.md).
4. **Empty, filtered-out, or failed initial region load** → `Empty` with an explicit recovery action.

**Exceptions:**
- **Inline search/suggestion failures** in `Combobox` or `Autocomplete` (and local async chip failures) stay **inline inside the results area**, preserving the user's draft with explicit `Retry` / `Restore` actions rather than setting a false `status="danger"` on the input or discarding context into a transient toast.
- **Irreversible destructive confirmation** uses `Modal` (`role="alertdialog"`).

## Strict `<FormField>` Ownership & Three Canonical Compositions

Data-entry controls (`Input`, `Textarea`, `NumberInput`, `Select`, `Combobox`, `Autocomplete`, `DatePicker`, `DateRangePicker`, `TagsInput`, `FileInput`, `Slider`, `RangeSlider`) **do not** expose shorthand `label`, `description`, or `message` props. Standalone inline fields (for example inside table cells or toolbars) accept native `<label htmlFor>`, `aria-label`, or `aria-labelledby`. Use a native label, description, and message with the shipped [Input](../components/input.md).

For Select, use the trigger's field ID to associate the label and `aria-describedby` to associate help or error text. A validation status colors the trigger. For a failed catalog request, place the explanation and recovery action in the panel through `errorState`. [Select](../components/select.md)

### 1. Single Control (`target="control"`)

```tsx
<FormField
  label="Billing email"
  controlId="billing-email"
  description="Invoices and receipt copies are sent here."
  status="danger"
  message="Enter a valid email address."
  required
>
  <Input name="email" type="email" />
</FormField>
```

- **Deterministic SSR ID binding:** `FormField` calls `const fallbackId = useId()` on every render, then computes `resolvedControlId = props.controlId ?? fallbackId` (plus `descriptionId` and `messageId`) **before** children render and passes it to both `<label htmlFor={resolvedControlId}>` and `FormFieldContext`. The child control always renders `id={ctx.controlId}` so server-rendered HTML guarantees `label.htmlFor === input.id` before client effects run. Pass explicit custom IDs on `<FormField controlId="...">`; passing a conflicting `id` directly on the nested control emits a development `warnOnce` while keeping `ctx.controlId` authoritative.
- **Merged descriptions & status:** The control joins `aria-describedby` in order `author → descriptionId → messageId`, inherits `status`, `disabled`, and `required` (explicit control props take precedence), sets `aria-invalid="true"` strictly when `status === 'danger' && !disabled`, and suppresses a duplicate feedback glyph on `FormField` when the control shell already paints its own status glyph.

### 2. Option Group (`target="group"`)

Use `target="group"` for `CheckboxGroup` and `RadioGroup`:

- `FormField` renders a non-interactive group heading (`labelId`), shared `description` (`descriptionId`), and shared `message` (`messageId`).
- The nested group container receives `role="group"` or `role="radiogroup"`, `aria-labelledby={labelId}`, `aria-describedby` (`author → descriptionId → messageId`), and `aria-invalid="true"` when `status === 'danger' && !disabled`.
- Individual `Checkbox`, `Radio`, and `*Card` items retain their own option labels and descriptions. `FormField`'s `required` prop is **never** propagated onto every individual `Checkbox` (a required checkbox group validates a minimum selection rule, not that every box must be checked).

When composing directly with `CheckboxGroup` or `RadioGroup`, pass the field heading ID as `aria-labelledby` and include shared help and error IDs in `aria-describedby`. Set the group's own `required` and `status` props to pair native validation with the visible message. Render the shared error once. See [CheckboxGroup](../components/checkbox.md#checkboxgroup) and [RadioGroup](../components/radio.md#radiogroup).

### 3. Composite Multi-Input Editor (`target="group"`)

Use `target="group"` with `feedbackIcon={false}` for editors containing multiple independently named inputs (such as a start/end review window or `DateRangePicker`):

- `FormField` owns only the group heading (`labelId`), shared description (`descriptionId`), and shared message (`messageId`) without imposing one shared `controlId` or `status` across all inputs.
- Each inner input keeps its own accessible name (`<label>` or `aria-label`), its own `id`, and its own local `status`.
- **Single sub-field error:** Only the offending input receives `status="danger"`, `aria-invalid="true"` (when not `disabled`, preserved on `readOnly`), and `aria-describedby` pointing to `messageId`. Sibling inputs stay `status="neutral"`, and the outer `role="group"` does not duplicate `aria-invalid="true"`.
- **Cross-field group error (no single culprit):** The `role="group"` container includes `messageId` in `aria-describedby` and receives `aria-invalid="true"` when `status === 'danger' && !disabled`.

## `Combobox` vs `Autocomplete` Value Authority

Unica keeps catalog entity selection and free-text completion cleanly separated:

- **`Combobox` (entity selection by stable ID):** Exposes two independent axes — the editable search draft (`inputValue` / `defaultInputValue` / `onInputValueChange`) and the committed selection (`value` / `defaultValue` / `onValueChange`). Typing updates the draft without corrupting the committed form value; dismissing without choosing restores the committed display text.
- **`Autocomplete` (free-text entry with suggestions):** Exposes a **single string form value** (`value` / `defaultValue` / `onValueChange`). The visible text in the field is always the form's answer, even when no suggestion matches, when the user presses `Tab` or `Enter` without an active option, or when suggestion loading fails. Accepting a suggestion updates that same string (using `insertText` when provided) and optionally notifies the caller via `onSelect`.

### `Autocomplete` Examples

**1. Free-text answer accepted without selecting a suggestion**

```tsx
// User types "custom-tag" and presses Enter with no active option or tabs away:
// FormData submits "custom-tag" and onValueChange("custom-tag") reflects the draft directly.
<Autocomplete
  name="branch"
  value={branch}
  onValueChange={setBranch}
  options={recentBranches}
/>
```

**2. Accepting a suggestion whose `insertText` differs from its display label**

```tsx
// Suggestion displays "Release Checklist — Template" but inserts "/template release-checklist".
// Selecting it updates `value` to `option.insertText` and invokes optional `onSelect(option)`.
<Autocomplete
  name="command"
  value={command}
  onValueChange={setCommand}
  onSelect={(option) => trackTemplateUse(option.id)}
  options={[
    { id: 'tpl-release', label: 'Release Checklist — Template', insertText: '/template release-checklist' },
  ]}
/>
```

**3. Suggestion fetch failure without losing user text**

```tsx
// When async suggestions fail, render an inline error and retry button inside the results popup.
// Keep `status="neutral"` on the field and preserve the user's typed `value` for normal form submission.
<Autocomplete
  name="owner"
  value={owner}
  onValueChange={setOwner}
  loading={isFetching}
  options={suggestions}
  emptyContent={
    fetchError ? (
      <InlineRetry message="Couldn't load suggestions" onRetry={retryFetch} />
    ) : undefined
  }
/>
```
