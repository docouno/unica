import { Alert, AlertActions, AlertClose, AlertDescription, AlertTitle } from '@docouno/unica';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Button } from '../../prototypes/button/button.proto.js';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewContext, PropSchema } from '../../workbench/types.js';
import { previewProps, previewText } from '../preview-code.js';

import {
  ActionStateExamples,
  AnatomyExamples,
  CloseStates,
  ContextExamples,
  ContextStateExamples,
  ContextBoundaryExamples,
  ContextOverlayExamples,
  EditorialGlyph,
  OverflowExamples,
  OverlayExample,
  RecoveryExample,
  SizeExamples,
  StatusExamples,
} from './alert.examples.js';

const props = {
  size: {
    kind: 'enum',
    group: 'Layout',
    default: 'm',
    description: 'Alert density.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  status: {
    kind: 'enum',
    group: 'Status',
    default: 'neutral',
    description: 'Meaning of the status glyph and signal.',
    choices: [
      { value: 'neutral' },
      { value: 'info' },
      { value: 'success' },
      { value: 'warning' },
      { value: 'danger' },
    ],
  },
  icon: {
    kind: 'slot',
    group: 'Status',
    default: 'default',
    description:
      'Pass a GlyphSource. Chromatic statuses keep their built-in sign when the slot is empty.',
    choices: [
      { value: 'default', label: 'Status glyph' },
      { value: 'editorial', label: 'Lightbulb' },
      { value: 'none', label: 'No custom glyph' },
    ],
  },
  role: {
    kind: 'enum',
    group: 'Announcement',
    default: 'auto',
    description: 'Select automatic urgency, an explicit live role, or quiet document semantics.',
    choices: [
      { value: 'auto', label: 'Automatic' },
      { value: 'none', label: 'Static' },
      { value: 'region', label: 'Named region' },
      { value: 'status', label: 'Polite status' },
      { value: 'alert', label: 'Assertive alert' },
    ],
  },
  'aria-label': {
    kind: 'string',
    group: 'Announcement',
    default: 'Review announcement',
    description: 'Accessible landmark name for the named region in this example.',
  },
  title: {
    kind: 'string',
    group: 'AlertTitle',
    default: 'Review requested',
    description: 'Text in the title slot.',
    demo: true,
  },
  titleAs: {
    kind: 'enum',
    group: 'AlertTitle',
    label: 'AlertTitle as',
    default: 'div',
    description: 'Use a native heading at the right level for the page.',
    choices: [
      { value: 'div' },
      { value: 'h2' },
      { value: 'h3' },
      { value: 'h4' },
      { value: 'h5' },
      { value: 'h6' },
    ],
  },
  description: {
    kind: 'string',
    group: 'AlertDescription',
    default: 'You can leave feedback before publishing.',
    description: 'Text in the description slot.',
    demo: true,
  },
  actionLabel: {
    kind: 'string',
    group: 'AlertActions',
    default: '',
    description: 'Add a sample action below the message.',
    demo: true,
  },
  close: {
    kind: 'boolean',
    group: 'AlertClose',
    default: true,
    description: 'Connect a dismiss action.',
    demo: true,
  },
  closeLabel: {
    kind: 'string',
    group: 'AlertClose',
    default: 'Dismiss review notice',
    description: 'Localized accessible name for the close button.',
    demo: true,
  },
  onClose: {
    kind: 'action',
    group: 'AlertClose',
    description: 'Reports the native button activation. The example then hides the message.',
    code: 'handleClose',
  },
} as const satisfies PropSchema;

type AlertValues = ComponentValues<typeof props>;

function AlertSubject({
  values,
  ctx,
}: {
  readonly values: AlertValues;
  readonly ctx: PreviewContext;
}): ReactElement {
  const [shown, setShown] = useState(true);
  const [publication, setPublication] = useState(0);
  const surface = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLButtonElement>(null);
  const hadFocus = useRef(false);
  useLayoutEffect(() => {
    const button = restore.current;
    if (
      !shown &&
      hadFocus.current &&
      button &&
      button.ownerDocument.activeElement === button.ownerDocument.body
    ) {
      button.focus();
    }
  }, [shown]);

  const dynamic = values.role !== 'none' && values.role !== 'region';
  const chosenRole = values.role === 'auto' ? undefined : values.role;
  return (
    <div className="alert-demo-case">
      {shown ? (
        <Alert
          {...ctx.subject}
          key={publication}
          ref={surface}
          size={values.size}
          status={values.status}
          role={dynamic && publication === 0 ? 'none' : chosenRole}
          aria-label={chosenRole === 'region' ? values['aria-label'] : undefined}
          icon={
            values.icon === 'editorial'
              ? EditorialGlyph
              : values.icon === 'none'
                ? false
                : undefined
          }
          close={
            values.close && (
              <AlertClose
                aria-label={values.closeLabel}
                onClose={() => {
                  hadFocus.current =
                    surface.current?.contains(surface.current.ownerDocument.activeElement) ?? false;
                  ctx.action('onClose')();
                  setShown(false);
                }}
              />
            )
          }
        >
          <AlertTitle as={values.titleAs}>{values.title}</AlertTitle>
          <AlertDescription>{values.description}</AlertDescription>
          {values.actionLabel.trim() && (
            <AlertActions>
              <Button variant="secondary" tone="neutral" size="s">
                {values.actionLabel}
              </Button>
            </AlertActions>
          )}
        </Alert>
      ) : (
        <Button
          ref={restore}
          variant="secondary"
          onClick={() => {
            setPublication(0);
            setShown(true);
          }}
        >
          Restore alert
        </Button>
      )}
      {shown && dynamic && (
        <div className="alert-demo-actions">
          <Button
            size="s"
            variant="ghost"
            tone="neutral"
            onClick={() => setPublication((revision) => revision + 1)}
          >
            Show feedback
          </Button>
          <span className="alert-demo-note">
            This publishes the message with the selected urgency.
          </span>
        </div>
      )}
    </div>
  );
}

export default defineComponent({
  id: 'alert',
  title: 'Alert',
  category: 'Feedback & Status',
  status: 'UI',
  summary: 'Persistent in-flow feedback for a section, page, or form.',
  props,
  constraints: [
    {
      kind: 'forbidden',
      when: { role: 'region' },
      affects: [{ key: 'aria-label', value: '' }],
      reason:
        'Give the region a landmark name. The package also accepts a heading through aria-labelledby.',
    },
    {
      kind: 'ignored',
      when: { close: false },
      affects: ['closeLabel'],
      reason: 'Dismissal belongs to an AlertClose in the close slot.',
    },
    {
      kind: 'forbidden',
      when: { close: true },
      affects: [{ key: 'closeLabel', value: '' }],
      reason: 'A visible close button requires an accessible name.',
    },
    ...(['info', 'success', 'warning', 'danger'] as const).map((status) => ({
      kind: 'precedence' as const,
      when: { status, icon: 'none' },
      affects: ['icon'],
      reason: 'A chromatic status uses its built-in sign when the custom slot is empty.',
    })),
    ...(['none', 'region', 'status', 'alert'] as const).map((role) => ({
      kind: 'precedence' as const,
      when: { role },
      affects: ['role'],
      reason: 'An explicit role controls announcement behavior independently of the status color.',
    })),
  ],
  code: (values) => {
    const attributes = previewProps(
      {
        status: values.status,
        size: values.size,
        role: values.role,
        ...(values.role === 'region' ? { 'aria-label': values['aria-label'] } : {}),
      },
      { status: 'neutral', size: 'm', role: 'auto' },
    );
    const icon =
      values.icon === 'editorial'
        ? ' icon={EditorialGlyph}'
        : values.icon === 'none'
          ? ' icon={false}'
          : '';
    const close = values.close
      ? ` close={<AlertClose aria-label=${previewText(values.closeLabel)} onClose={handleClose} />}`
      : '';
    const title = values.title.trim()
      ? `\n  <AlertTitle${previewProps({ as: values.titleAs }, { as: 'div' })}>${previewText(values.title)}</AlertTitle>`
      : '';
    const description = values.description.trim()
      ? `\n  <AlertDescription>${previewText(values.description)}</AlertDescription>`
      : '';
    const action = values.actionLabel.trim()
      ? `\n  <AlertActions><button type="button">${previewText(values.actionLabel)}</button></AlertActions>`
      : '';
    return `<Alert${attributes}${icon}${close}>${title}${description}${action}\n</Alert>`;
  },
  render: ({ values, ctx }) => (
    <AlertSubject key={JSON.stringify(values)} values={values} ctx={ctx} />
  ),
  matrixViews: [
    {
      id: 'status',
      title: 'Status & material',
      rows: 'status',
      reference: () => <StatusExamples />,
    },
    {
      id: 'sizes',
      title: 'Five statuses × S / M / L',
      rows: 'size',
      reference: () => <SizeExamples />,
    },
  ],
  cases: [
    {
      id: 'context-states',
      title: 'Contextual action states',
      kind: 'behavior',
      render: () => <ContextStateExamples />,
    },
    {
      id: 'context-boundaries',
      title: 'Color boundaries & explicit tones',
      kind: 'content',
      render: () => <ContextBoundaryExamples />,
    },
    {
      id: 'context-overlay',
      title: 'Context inside an overlay',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <ContextOverlayExamples />,
    },
    {
      id: 'anatomy',
      title: 'Anatomy & content',
      kind: 'behavior',
      render: () => <AnatomyExamples />,
    },
    {
      id: 'close',
      title: 'Close states & focus',
      kind: 'behavior',
      render: () => <CloseStates />,
    },
    {
      id: 'actions',
      title: 'Action availability & emphasis',
      kind: 'behavior',
      render: () => <ActionStateExamples />,
    },
    {
      id: 'recovery',
      title: 'Recovery & action states',
      kind: 'behavior',
      render: () => <RecoveryExample />,
    },
    {
      id: 'overflow',
      title: 'Narrow, rich & long content',
      kind: 'content',
      render: () => <OverflowExamples />,
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <OverlayExample />,
    },
  ],
  usage: [
    {
      id: 'context',
      title: 'Contextual content & actions',
      code: `<Alert status={status} role="none" close={<AlertClose aria-label="Dismiss notice" onClose={dismiss} />}>
  <AlertTitle>{message.title}</AlertTitle>
  <AlertDescription>Reference <Code>{message.reference}</Code></AlertDescription>
  <AlertActions><button type="button" onClick={acknowledge}>Acknowledge</button></AlertActions>
</Alert>`,
      render: () => <ContextExamples />,
    },
  ],
});
