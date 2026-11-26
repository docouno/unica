import type { ContextMenuInvocation } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { toggle, eventProp } from '../control-props.js';
import { menuProps, openConstraints } from '../menu/menu.schema.js';
import { Invocations } from './context-menu.examples.js';
import { InvoiceActions } from './invoice-actions.js';
import { ReleaseNotesActions } from './release-notes-actions.js';

const nativeCode = `import { useState } from 'react';
import { Button, Card, ContextMenu, ContextMenuTrigger, Input, Link, MenuContent, MenuItem, MenuTrigger } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ReleaseNotesActions({ allowSelection = false, onRename }) {
  const [selection, setSelection] = useState('');

  return (
    <ContextMenu
      shouldOpen={({ native, source, selection }) => !native || (
        allowSelection && Boolean(selection) && Boolean(source.closest('[data-document-excerpt]'))
      )}
      onInvoke={(invocation) => setSelection(invocation.selection)}
    >
      <ContextMenuTrigger>
        <Card>
          <p data-document-excerpt>Select part of this sentence and right-click it.</p>
          <div data-native-context-region><Input aria-label="Revision note" /></div>
          <Link href="https://react.dev/blog/2024/12/05/react-19">Open the source document</Link>
          <MenuTrigger asChild><Button>Release notes actions</Button></MenuTrigger>
          <MenuContent align="end">
            <MenuItem disabled={!selection} onClick={() => navigator.clipboard.writeText(selection)}>Copy selected text</MenuItem>
            <MenuItem onClick={onRename}>Rename document</MenuItem>
          </MenuContent>
        </Card>
      </ContextMenuTrigger>
    </ContextMenu>
  );
}`;

export default defineComponent({
  id: 'context-menu',
  title: 'ContextMenu',
  category: 'Overlays',
  status: 'UI',
  componentName: 'ContextMenu',
  summary: 'Open an object’s actions from its visible button, the pointer, or the keyboard.',
  props: {
    ...menuProps,
    longPress: toggle('Interaction', 'Allow a touch hold on the target to open its menu.'),
    shouldOpen: eventProp(
      'Override the browser-context policy for a particular target or selection.',
      '(context) => !context.native',
      '(context: ContextMenuInvocation) => boolean',
    ),
    onInvoke: eventProp(
      'Receive the invocation kind, source element, selected text and native-context flag before focus moves.',
      '(context) => console.log(context)',
      '(context: ContextMenuInvocation) => void',
    ),
  },
  constraints: openConstraints,
  render: ({ values, ctx }) => {
    const live = ctx.tab === 'playground' && !ctx.comparing;
    const open = live && values.open !== 'omitted' ? values.open === 'true' : undefined;
    const defaultOpen = live && values.defaultOpen;
    return (
      <InvoiceActions
        key={`${open === undefined}-${defaultOpen}`}
        menuProps={{
          size: values.size,
          open,
          defaultOpen,
          onOpenChange: ctx.action('onOpenChange'),
          shouldOpen: (invocation) => {
            ctx.action('shouldOpen')({ native: invocation.native, kind: invocation.kind });
            return !invocation.native;
          },
          onInvoke: ({ kind, source, selection, native }: ContextMenuInvocation) =>
            ctx.action('onInvoke')({ kind, source: source.localName, selection, native }),
        }}
        contentProps={{ align: values.align, ...ctx.subject }}
        targetProps={ctx.subject}
        longPress={values.longPress}
        onRequest={ctx.action('onCommand')}
      />
    );
  },
  code: ({ size, align, longPress, open, defaultOpen }) => `import {
  Button, Card, ContextMenu, ContextMenuTrigger, MenuContent, MenuItem, MenuSeparator, MenuTrigger,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function InvoiceActions({ onRename, onCopy, onTrash }) {
  return (
    <ContextMenu size="${size}"${longPress ? ' longPress' : ''}${open === 'omitted' ? (defaultOpen ? ' defaultOpen' : '') : ` open={${open}}`}>
      <ContextMenuTrigger>
        <Card tabIndex={0} role="group" aria-label="Invoice draft">
          <p>Invoice draft</p>
          <MenuTrigger asChild><Button>File actions</Button></MenuTrigger>
          <MenuContent align="${align}" aria-label="Invoice draft actions">
            <MenuItem shortcut="F2" onClick={onRename}>Rename</MenuItem>
            <MenuItem onClick={onCopy}>Copy file link</MenuItem>
            <MenuItem disabled description="Publish the draft first">Export PDF</MenuItem>
            <MenuSeparator />
            <MenuItem tone="danger" onClick={onTrash}>Move to trash</MenuItem>
          </MenuContent>
        </Card>
      </ContextMenuTrigger>
    </ContextMenu>
  );
}`,
  states: [
    {
      id: 'invocations',
      title: 'Density and touch hold',
      rows: 'size',
      cols: 'longPress',
      fixed: { align: 'start', defaultOpen: false, open: 'omitted' },
      overlayStage: true,
      caption:
        'Open the actions button or use a context gesture. Touch hold is available where enabled.',
    },
  ],
  cases: [
    {
      id: 'placement',
      title: 'One menu, two anchors',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      reset: true,
      caption:
        'Right-click the tile, then activate its actions button to move the open menu to the button.',
      render: Invocations,
    },
    {
      id: 'invoke',
      title: 'Pointer and keyboard',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      reset: true,
      caption:
        'Right-click Invoice draft or focus the tile and press Shift+F10. The actions button opens the same menu.',
      render: Invocations,
    },
    {
      id: 'touch',
      title: 'Touch and opt-in hold',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      reset: true,
      caption: 'Hold the tile to open its actions. Moving away or lifting early cancels the hold.',
      render: ({ ctx }) => <Invocations ctx={ctx} touch />,
    },
  ],
  compositions: [
    {
      id: 'native',
      title: 'Links, fields and selection',
      mode: 'live',
      reset: true,
      controls: {
        allowSelection: {
          kind: 'boolean',
          label: 'Use document actions for selected text',
          default: false,
        },
      },
      caption:
        'The note field, source link and text selection keep their browser menus. Enable document actions for selected text, then select a phrase and right-click to copy it.',
      render: ({ ctx }) => (
        <div className="context-study-live">
          <ReleaseNotesActions
            allowSelection={ctx.story?.controls.allowSelection === true}
            contentProps={ctx.subject}
            targetProps={ctx.subject}
          />
        </div>
      ),
      code: nativeCode,
    },
  ],
});
