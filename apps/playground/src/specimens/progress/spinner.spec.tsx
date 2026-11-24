import { Spinner } from '@docouno/unica';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewProps, PropSchema } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { labelledByText, withActivityName, withActivityNameCode } from './activity-name.js';
import {
  SpinnerForeground,
  SpinnerMotion,
  SpinnerOverlay,
  SpinnerTextScale,
} from './spinner.examples.js';
import { SpinnerLifecycleExample } from './spinner-lifecycle.js';
import { WorkspaceAddressCheck } from './spinner-placement.js';
import placementSource from './spinner-placement.tsx?raw';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'inherit',
    description:
      'Inherit the surrounding font size at 1em, or use a fixed 14, 16 or 20px icon slot.',
    choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  tone: {
    kind: 'enum',
    group: 'Role',
    default: 'inherit',
    description: 'Inherit the surrounding text color or use a neutral, muted or accent foreground.',
    choices: [{ value: 'inherit' }, { value: 'neutral' }, { value: 'muted' }, { value: 'accent' }],
  },
  delay: {
    kind: 'number',
    group: 'Availability',
    default: 0,
    publicType: 'number',
    examples: [0, 150],
    description:
      'Milliseconds before the drawing appears. The SVG occupies its slot immediately. Negative and non-finite delays use zero.',
  },
  'aria-label': {
    kind: 'string',
    group: 'Semantics',
    default: '',
    label: 'Accessible name',
    publicType: 'string',
    examples: ['', 'Checking files'],
    description: 'Name a standalone glyph. Without an accessible name the Spinner is decorative.',
  },
  labelledByText: { ...labelledByText, examples: ['', 'Archive transfer'] },
  'aria-hidden': {
    kind: 'boolean',
    group: 'Semantics',
    default: false,
    publicType: "boolean | 'true' | 'false'",
    description:
      'Keep a named glyph decorative when surrounding text already describes the operation.',
  },
} as const satisfies PropSchema;

function SpinnerPreview({
  ctx,
  values: { labelledByText: reference, ...values },
}: PreviewProps & { readonly values: ComponentValues<typeof props> }): ReactElement {
  const id = useId();
  return withActivityName(
    'Spinner',
    id,
    reference,
    <Spinner
      {...ctx.subject}
      {...values}
      className="spinner-example-preview"
      aria-labelledby={reference.trim() ? id : undefined}
    />,
  );
}

export default defineComponent({
  id: 'spinner',
  title: 'Spinner',
  category: 'Feedback & Status',
  status: 'UI',
  summary:
    'Compact activity for work with an unknown duration. The surrounding text tells you what is happening.',
  componentName: 'Spinner',
  props,
  constraints: [
    {
      kind: 'ignored',
      when: { 'aria-hidden': true },
      affects: ['aria-label'],
      reason:
        'An explicitly hidden Spinner stays out of the accessibility tree even when it has a name.',
    },
  ],
  render: withOverlaySurface(SpinnerPreview, 'border-box'),
  code: ({ labelledByText, ...values }) => {
    const attributes = previewProps(values, {
      size: 'inherit',
      tone: 'inherit',
      delay: 0,
      'aria-label': '',
      'aria-hidden': false,
    });
    return withActivityNameCode(
      'Spinner',
      labelledByText,
      (label) => `<Spinner${attributes}${label} />`,
    );
  },
  states: [
    {
      id: 'scale',
      rows: 'size',
      title: 'Glyph size',
      caption:
        'The inherited size follows the surrounding font. The three fixed slots measure 14, 16 and 20px.',
    },
    {
      id: 'tones',
      rows: 'tone',
      title: 'Foreground tone',
      caption: 'Compare inherited, neutral, muted and accent ink at the same size.',
    },
  ],
  cases: [
    {
      id: 'text-scale',
      title: 'Inherit the text size',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The same 1em Spinner follows the line of small or large body text without an explicit size.',
      render: withOverlaySurface(SpinnerTextScale, 'border-box'),
    },
    {
      id: 'foreground',
      title: 'Following the text color',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Both operations use accent text. The first glyph inherits that color. The second uses a quieter muted tone.',
      render: withOverlaySurface(SpinnerForeground, 'border-box'),
    },
    {
      id: 'motion',
      title: 'Motion and a readable still frame',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Soft and Frost change the length of an orbiting arc. Pixel advances a trail through eight cells. Compare that motion with the fixed glyph used for reduced motion.',
      render: withOverlaySurface(SpinnerMotion, 'border-box'),
    },
    {
      id: 'lifecycle',
      mode: 'live',
      title: 'Short waits and completion',
      kind: 'behavior',
      caption:
        'Each save reserves the same slot and updates the text immediately. A fast save finishes before the 150ms reveal delay. Longer requests show the Spinner until a result replaces it.',
      actions: [
        { id: 'save', label: 'Save · 2.2s' },
        { id: 'quick', label: 'Quick save · 80ms' },
        { id: 'fail', label: 'Try failure' },
      ],
      reset: true,
      render: withOverlaySurface(SpinnerLifecycleExample, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Waiting on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'pinned',
      caption:
        'A local status names the pending search while the rest of the page remains available.',
      render: SpinnerOverlay,
    },
  ],
  compositions: [
    {
      id: 'placement',
      title: 'Inline and reserved control slots',
      mode: 'live',
      caption:
        'Place the activity beside its status text or in the address field’s trailing slot. Editing the address clears the result until it matches the checked value.',
      controls: {
        placement: {
          kind: 'enum',
          label: 'Spinner placement',
          default: 'inline',
          choices: [
            { value: 'inline', label: 'Inline' },
            { value: 'field', label: 'Field' },
          ],
        },
        available: { kind: 'boolean', label: 'Address available', default: false },
      },
      reset: true,
      code: placementSource,
      render: withOverlaySurface(
        ({ ctx }) => (
          <WorkspaceAddressCheck
            placement={ctx.story?.controls.placement === 'field' ? 'field' : 'inline'}
            outcome={ctx.story?.controls.available === true ? 'available' : 'pending'}
            announce={!ctx.comparing}
            spinnerProps={ctx.subject}
          />
        ),
        'border-box',
      ),
    },
  ],
});
