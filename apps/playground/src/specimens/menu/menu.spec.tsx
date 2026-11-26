import { defineComponent } from '../../workbench/types.js';
import { menuProps, openConstraints } from './menu.schema.js';
import { Choices, Density, FileActions, Overflow } from './menu.examples.js';
import { DocumentToolbar } from './document-toolbar.js';
import { DocumentMenu } from './document-menu.js';
const toolbarCode = `import { useState } from 'react';
import { Button, Card, Menu, MenuContent, MenuItem, MenuTrigger, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DocumentToolbar() {
  const [receipt, setReceipt] = useState('');

  return (
    <Card>
      <Menu>
        <MenuTrigger asChild><Button>Document actions</Button></MenuTrigger>
        <MenuContent align="end">
          <MenuItem onClick={() => setReceipt('Rename requested.')}>Rename document</MenuItem>
          <MenuItem onClick={() => setReceipt('PDF export requested.')}>Export PDF</MenuItem>
        </MenuContent>
      </Menu>
      <Text role="status">{receipt}</Text>
    </Card>
  );
}`;

export default defineComponent({
  id: 'menu',
  title: 'Menu',
  componentName: 'Menu',
  category: 'Overlays',
  status: 'UI',
  summary: 'A button opens commands, navigation and immediate choices for one task.',
  props: menuProps,
  constraints: openConstraints,
  render: ({ values, ctx }) => {
    const live = ctx.tab === 'playground' && !ctx.comparing;
    const open = live && values.open !== 'omitted' ? values.open === 'true' : undefined;
    const defaultOpen = live && values.defaultOpen;
    return (
      <DocumentMenu
        key={`${open === undefined}-${defaultOpen}`}
        menuProps={{
          size: values.size,
          open,
          defaultOpen,
          onOpenChange: ctx.action('onOpenChange'),
        }}
        contentProps={{ align: values.align, ...ctx.subject }}
        triggerProps={ctx.subject}
        onCommand={ctx.action('onCommand')}
      />
    );
  },
  code: ({
    size,
    align,
    open,
    defaultOpen,
  }) => `import { Button, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DocumentActions({ onRename, onArchive }) {
  return (
    <Menu size="${size}"${open === 'omitted' ? (defaultOpen ? ' defaultOpen' : '') : ` open={${open}}`}>
      <MenuTrigger asChild><Button>Document actions</Button></MenuTrigger>
      <MenuContent align="${align}">
        <MenuItem onClick={onRename}>Rename</MenuItem>
        <MenuItem onClick={() => navigator.clipboard.writeText(location.href)}>Copy link</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" onClick={onArchive}>Archive</MenuItem>
      </MenuContent>
    </Menu>
  );
}`,
  states: [
    {
      id: 'actions',
      title: 'Density and alignment',
      rows: 'size',
      cols: 'align',
      fixed: { defaultOpen: false, open: 'omitted' },
      overlayStage: true,
      caption: 'Open a button to compare row density and logical alignment.',
    },
  ],
  cases: [
    {
      id: 'density',
      title: 'Command columns and keyboard hints',
      kind: 'content',
      mode: 'live',
      overlayStage: true,
      caption: 'Open each density to compare icon slots, keyboard hints and destructive commands.',
      render: Density,
    },
    {
      id: 'states',
      title: 'Row states and choices',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      overlayStage: true,
      caption:
        'Checkbox choices keep the menu open. Sort choices close it. Disabled rows stay available to arrow keys.',
      render: Choices,
    },
    {
      id: 'submenu',
      title: 'Submenu',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      overlayStage: true,
      caption:
        'Open Export as. It opens alongside the menu when there is room, and in place on touch or in a narrow viewport.',
      render: FileActions,
    },
    {
      id: 'live',
      title: 'Open, choose and dismiss',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      overlayStage: true,
      caption: 'Compare command and choice activation with the pointer or keyboard.',
      render: ({ ctx }) => (
        <>
          <Choices ctx={ctx} />
          <FileActions ctx={ctx} />
        </>
      ),
    },
    {
      id: 'overflow',
      title: 'Long content and scrolling',
      kind: 'content',
      mode: 'live',
      reset: true,
      overlayStage: true,
      caption:
        'Inspect wrapping and full keyboard hints. Open Move to folder and use End, Home or type a folder name.',
      render: Overflow,
    },
  ],
  compositions: [
    {
      id: 'toolbar',
      title: 'Document commands',
      mode: 'live',
      reset: true,
      caption: 'Rename and Export PDF report their requests and return focus to the button.',
      render: ({ ctx }) => (
        <DocumentToolbar contentProps={ctx.subject} triggerProps={ctx.subject} />
      ),
      code: toolbarCode,
    },
  ],
});
