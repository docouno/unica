import type { ComponentProps } from 'react';
import type { ContextMenu } from '../../prototypes/menu/context-menu.proto.js';
import { defineComponent } from '../../workbench/types.js';
import { choice, toggle, eventProp } from '../control-props.js';
import { Invocations, Placement } from './context-menu.examples.js';
import { InvoiceActions } from './invoice-actions.js';
import commandSource from './invoice-commands.ts?raw';
import invoiceSource from './invoice-actions.tsx?raw';
import { ReleaseNotesActions } from './release-notes-actions.js';
import nativeSource from './release-notes-actions.tsx?raw';

type Invocation = Parameters<NonNullable<ComponentProps<typeof ContextMenu>['onInvoke']>>[0];

export default defineComponent({
  id: 'context-menu',
  title: 'ContextMenu',
  category: 'Overlays',
  status: 'Proto',
  componentName: 'ContextMenu',
  summary:
    'Open an object’s actions from its visible button, the pointer, or the keyboard. Preserve the browser’s own editing and selection commands.',
  props: {
    size: choice(
      'Geometry',
      'Density of the open menu rows. This example uses S. Omitting size uses M.',
      ['s', 'm', 'l'],
      's',
    ),
    align: choice(
      'Geometry',
      'Logical alignment of the menu opened from its actions button. This example uses end. Omitting align uses start.',
      ['start', 'end'],
      'end',
    ),
    longPress: toggle(
      'Interaction',
      'Allow a touch hold on the target to open its menu. Taps and scrolling remain available.',
    ),
    onInvoke: eventProp(
      'Receives the invocation kind, source element, selected text and native-context flag before the menu takes focus. The event log shows the source element’s tag name.',
      '(context) => console.log(context)',
      '(context: { readonly kind: "pointer" | "keyboard" | "touch" | "button"; readonly source: Element; readonly selection: string; readonly native: boolean }) => void',
    ),
    onCommand: {
      ...eventProp(
        'Logs the requested entry ID when an enabled command runs. The owner supplies run on each MenuEntry.',
        '(id) => console.log(id)',
      ),
      demo: true,
    },
  },
  render: ({ values, ctx }) => (
    <InvoiceActions
      menuProps={{
        size: values.size,
        align: values.align,
        panelAttributes: ctx.subject,
        onInvoke: ({ kind, source, selection, native }: Invocation) =>
          ctx.action('onInvoke')({ kind, source: source.localName, selection, native }),
      }}
      targetProps={ctx.subject}
      longPress={values.longPress}
      onRequest={ctx.action('onCommand')}
    />
  ),
  code: ({
    size,
    align,
    longPress,
  }) => `${invoiceSource.replace("import { invoiceCommands } from './invoice-commands.js';", commandSource.replace('export const', 'const')).replaceAll('../../prototypes/', './prototypes/').replace('export function InvoiceActions', 'function InvoiceActions')}

export function FileActions() {
  return <InvoiceActions menuProps={{ size: '${size}', align: '${align}' }}${longPress ? ' longPress' : ''} />;
}`,
  cases: [
    {
      id: 'placement',
      title: 'One menu, two anchors',
      kind: 'behavior',
      mode: 'pinned',
      overlayStage: true,
      caption:
        'Compare the same four commands at the pointer and beside the actions button. Export PDF stays unavailable until publication. These two panels are pinned.',
      render: Placement,
    },
    {
      id: 'invoke',
      title: 'Pointer and keyboard',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      reset: true,
      caption:
        'Right-click Invoice draft or focus the tile and press Shift+F10. The actions button opens the same menu. Choosing a command reports the request to the file owner.',
      render: Invocations,
    },
    {
      id: 'touch',
      title: 'Touch and opt-in hold',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      reset: true,
      caption:
        'Hold Invoice draft to open its actions. Moving away or lifting early cancels the hold. The visible button also works with a tap or keyboard.',
      render: ({ ctx }) => <Invocations ctx={ctx} touch />,
    },
  ],
  compositions: [
    {
      id: 'native',
      title: 'Links, fields and selection',
      mode: 'live',
      overlayStage: true,
      reset: true,
      controls: {
        allowSelection: {
          kind: 'boolean',
          label: 'Use document actions for selected text',
          default: false,
        },
      },
      caption:
        'The note field, source link and text selection keep their browser menus. Enable document actions for selected text, select part of the sentence, then right-click and copy it. The standalone example accepts allowSelection to enable the same policy.',
      render: ({ ctx }) => (
        <div className="context-study-live" data-menu-boundary>
          <ReleaseNotesActions
            allowSelection={ctx.story?.controls.allowSelection === true}
            menuProps={{ panelAttributes: ctx.subject }}
            targetProps={ctx.subject}
          />
        </div>
      ),
      code: nativeSource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
