# Progress and ProgressCircle

Both components describe a phase of an operation. Use `Progress` for a linear track with an optional heading and measurement. Use `ProgressCircle` in a compact icon slot beside text. Pass a known `value` in the units of `max` or pass `null` during an indeterminate phase.

```tsx
import { Progress, ProgressCircle } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ArchiveTransfer({ sent }: { sent: number | null }) {
  return (
    <Progress
      label="Uploading archive"
      value={sent}
      max={80}
      valueLabel={sent === null ? undefined : `${sent} of 80 MB`}
      active={sent !== null}
    />
  );
}

export function CompactTransfer({ sent }: { sent: number | null }) {
  return (
    <ProgressCircle
      aria-label="Uploading archive"
      aria-valuetext={sent === null ? undefined : `${sent} of 80 MB`}
      value={sent}
      max={80}
      tone="accent"
    />
  );
}
```

The shown amount is controlled by the application. Finite values are clamped to the closed range from zero to `max`. A missing measurement, a non-finite value, or a total that is non-positive or non-finite uses the indeterminate phase. Completion reports that the current phase reached its total. Report success, errors, pauses, or recovery actions in the surrounding UI.

## Shared props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `value` | `number \| null` | Required | The measured amount or an indeterminate phase. |
| `max` | `number` | `100` | Positive finite total in the same units as `value`. |
| `aria-labelledby`, `aria-label` | `string` | — | Name the operation. A referenced label takes precedence. Supply a name for an exposed `ProgressCircle` or a `Progress` without a visible label. |
| `aria-describedby`, `aria-description` | `string` | — | Describe the operation on the progressbar. |
| `aria-valuetext` | `string` | — | Describe a known measurement in custom units. It takes precedence over `valueLabel` for assistive technology. |
| `aria-hidden` | React ARIA boolean | — | Hide a redundant indicator from assistive technology when the surrounding UI conveys equivalent information. On `Progress` this applies to the whole group. |

The progressbar exposes the source measurement. For example, `value={42}` and `max={80}` expose 0, 42, and 80 as the minimum, current value, and maximum. A linear bar shows 52% by default. In the indeterminate phase, numeric ARIA attributes and custom value text are omitted. A visible label or an external name still identifies the phase. Use an application-owned region for busy state and announcements.

## Progress

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `size` | `ProgressSize` | `m` | Track thickness is 4 px for `s`, 8 px for `m`, and 12 px for `l`. |
| `status` | `ProgressStatus` | `accent` | Measured fill uses `accent`, `neutral`, `info`, `success`, `warning`, or `danger`. Waiting always uses the active theme's accent pattern. |
| `label` | `string` | — | Visible operation name. It also names the track when no external name is supplied. |
| `valueLabel` | `string` | — | Custom visible measurement. It also supplies accessible value text when explicit `aria-valuetext` is absent, including when `showValue` is false. |
| `showValue` | `boolean` | `true` | Show the custom measurement or a whole percent. During indeterminate work the slot is reserved while its text is hidden. Keep the same `valueLabel` format when you need the custom slot to retain its dimensions. |
| `active` | `boolean` | `false` | Allow the Frost leading edge to animate for an advancing, partially measured phase. |
| `paused` | `boolean` | `false` | Keep the measurement, quiet the leading edge, and stop the waiting texture. Takes precedence over `active`. |
| `ref` | `Ref<HTMLDivElement>` | — | React 19 ref to the outer block. Native layout attributes target this block, which contains the heading and track. |

The single semantic progressbar is the inner track. Its label and units sit above and outside it. In right-to-left layouts, the fill starts from the right and the heading follows inline direction. On floating surfaces the track inherits the overlay control material and keeps the theme's waiting paint. At zero the track is empty immediately. Frost fades an existing glow when the phase reaches its total. Reduced motion uses immediate geometry and a static waiting stripe. Forced colors render a system-color outline and measured fill, or a dashed outline while waiting.

## ProgressCircle

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `size` | `SpinnerSize` | `inherit` | Uses the same `inherit`, `s`, `m`, and `l` icon slots as [Spinner](spinner.md). |
| `tone` | `SpinnerTone` | `inherit` | Uses the same `inherit`, `neutral`, `muted`, and `accent` foreground tones as Spinner. |
| `ref` | `Ref<SVGSVGElement>` | — | React 19 ref to the SVG progressbar. Native placement attributes also target this element. |

The SVG shows an arc in Soft and Frost and fills eight cells in Pixel. The leading Pixel cell can be partially filled. Both travel clockwise in either text direction. When measurement is unavailable, the same SVG slot shows Spinner motion. Reduced motion uses still shapes and immediate measured updates. Forced colors use system paint for the visible track and fill.

Both components are passive inside a form. Tab skips them and `FormData` contains only the surrounding controls. Resetting the form leaves the measurement under application control.
