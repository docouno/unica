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
- **Discrete and range controls** (`Checkbox`, `Radio`, `CheckboxCard`, `RadioCard`, `Slider`, `RangeSlider`, `SegmentedControl`, [`ChipGroup`](../components/chip.md), [Dropzone](../components/dropzone.md)): `ControlStatus = 'neutral' | 'danger'`.
- **Immediate switches** (`Switch`, `SwitchCard`): **zero `status` prop**. A switch performs an immediate toggle; failed persistence belongs in application feedback.
- **Validation status** sets `aria-invalid="true"` on an available control or group with `status="danger"`. Read-only values can still show this state and explain why a locked value needs attention.
- **Unified supporting slots:** `description` holds persistent instructions and `message` holds validation/status feedback. Controls do not introduce `invalid`, `error`, `errorMessage`, `initialError`, or `issue`.

## Four Feedback Channels

Choose one channel based on scope and lifecycle:

1. **Field or group validation** → `FormField` (`status` + `message`), paired with the affected control's own frame/indicator.
2. **Operation result, background job, or generic async failure** → [Toast](../components/toast.md) (one live notification per explicit operation key, announced politely by default without moving focus).
3. **Persistent contextual warning for a section/page or form submit summary** → [Alert](../components/alert.md).
4. **Empty, filtered-out, or failed initial region load** → [Empty](../components/empty.md) with an explanation and a recovery action when one is available.

**Exceptions:**
- **Inline search/suggestion failures** in `Combobox` or `Autocomplete` (and local async chip failures) stay **inline inside the results area**, preserving the user's draft with explicit `Retry` / `Restore` actions rather than setting a false `status="danger"` on the input or discarding context into a transient toast.
- **File admission** puts a correction below [FileInput](../components/file-input.md) or [Dropzone](../components/dropzone.md) while retaining an accepted selection. Application validation belongs to the surrounding `FormField`, and upload or verification results belong to the attachment row or a broader application feedback channel.
- **Irreversible destructive confirmation** uses `Modal` (`role="alertdialog"`).

## Strict `<FormField>` Ownership & Three Canonical Compositions

Data-entry controls expose their editor attributes and can be composed with [FormField](../components/form-field.md) for the visible label, instructions, and message. A standalone inline field such as [NumberInput](../components/number-input.md) accepts a native label, `aria-label`, or `aria-labelledby`.

1. **Single editor.** Use the default `target="control"`. The visible native label and editor ID match in server-rendered HTML. An explicit ID belongs on `controlId`. The editor combines author descriptions with the field's instructions, message, and optional count. Its supported props can override inherited state.
2. **Choice group.** Use `target="group"` with CheckboxGroup, RadioGroup, or another named group. Shared feedback describes the group rule. Individual options keep their names, local descriptions, and option status. A required CheckboxGroup validates that at least one available option is checked.
3. **Composite editor.** Use `target="group"` and give each editor its own name. For a review window with independently editable start and end times, attach an end-specific error to End. Attach an error about the relationship between both values to the group. Pass `feedbackIcon={false}` if the affected editor already renders the glyph.

The editor's availability governs its own invalid state and message reference. When only the editor is disabled, the field can still show external feedback. Disable the field to hide its validation message and keep the explanation of unavailability in `description`.

For a failed catalog request, use the Select panel's `errorState` to show the explanation and recovery action. [Select](../components/select.md#availability-and-messages)

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
