import { defineComponent } from '../../workbench/types.js';
import { choice, eventProp } from '../control-props.js';
import { MenuPreview } from '../../prototypes/menu/menu.proto.js';
import { Density, States, BranchPreview, LiveExamples, Overflow } from './menu.examples.js';
import { DocumentToolbar } from './document-toolbar.js';
import { DocumentMenu } from './document-menu.js';
import { documentCommands } from './document-commands.js';
import commandSource from './document-commands.ts?raw';
import receiptSource from './use-document-receipt.ts?raw';
import menuSource from './document-menu.tsx?raw';
import toolbarSource from './document-toolbar.tsx?raw';

const commands = commandSource.replace('export const', 'const');
const menuProgram = menuSource
  .replace("import { documentCommands } from './document-commands.js';", commands)
  .replace(
    "import { useDocumentReceipt } from './use-document-receipt.js';",
    receiptSource.replaceAll('export ', ''),
  )
  .replaceAll('../../prototypes/', './prototypes/')
  .replace('export function DocumentMenu', 'function DocumentMenu');

export default defineComponent({
  id: 'menu',
  title: 'Menu',
  componentName: 'Menu',
  category: 'Overlays',
  status: 'Proto',
  summary: 'A button opens commands, navigation and immediate choices for one task.',
  props: {
    size: choice('Geometry', 'Density of the menu rows.', ['s', 'm', 'l'], 'm'),
    align: choice(
      'Geometry',
      'Logical alignment of the live menu at its trigger.',
      ['start', 'end'],
      'start',
    ),
    presentation: {
      ...choice(
        'Interaction',
        'Live opens a Menu from its button. Pinned draws the same entries as a static panel.',
        ['live', 'pinned'],
        'live',
      ),
      demo: true,
    },
    onCommand: {
      ...eventProp(
        'The example logs the activated entry ID through its run callback. Rename and Archive report requests. Copy link writes the failover guide address.',
        '(id) => console.log(id)',
      ),
      demo: true,
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { presentation: 'pinned' },
      affects: ['align'],
      reason: 'A pinned panel has no trigger to align to.',
    },
  ],
  render: ({ values, ctx }) =>
    values.presentation === 'pinned' ? (
      <MenuPreview
        {...ctx.subject}
        label="Document actions"
        items={documentCommands}
        size={values.size}
        inert
      />
    ) : (
      <DocumentMenu
        menuProps={{ size: values.size, align: values.align, panelAttributes: ctx.subject }}
        triggerProps={ctx.subject}
        onCommand={ctx.action('onCommand')}
      />
    ),
  code: ({ size, align, presentation }) =>
    presentation === 'pinned'
      ? `import { MenuPreview } from './prototypes/menu/menu.proto.js';
import '@docouno/unica/styles.css';
${commands}

export function DocumentMenu() {
  return <MenuPreview label="Document actions" items={documentCommands} size="${size}" inert />;
}`
      : `${menuProgram}
export function DocumentActions() {
  return <DocumentMenu menuProps={{ size: '${size}', align: '${align}' }} />;
}`,
  states: [
    {
      id: 'actions',
      title: 'Commands and sizes',
      rows: 'size',
      fixed: { presentation: 'pinned' },
      overlayStage: true,
      caption: 'Compare the row heights, icon slots and destructive command at S, M and L.',
    },
  ],
  cases: [
    {
      id: 'density',
      title: 'Command columns and keyboard hints',
      kind: 'content',
      mode: 'pinned',
      overlayStage: true,
      caption:
        'Compare a link row, icon commands, shortcut hints and a separated destructive command at three densities. The hints show how an application can label its shortcuts.',
      render: Density,
    },
    {
      id: 'states',
      title: 'Row states and choices',
      kind: 'behavior',
      mode: 'pinned',
      overlayStage: true,
      caption:
        'Compare hover, press and focus on commands with checked, unchecked and unavailable choices. The disabled Rename row keeps its focus ring and reason.',
      render: States,
    },
    {
      id: 'submenu',
      title: 'Submenu',
      kind: 'behavior',
      mode: 'pinned',
      overlayStage: true,
      caption:
        'Compare a cascading Export as menu with a single panel that includes Back. Narrow artboards show the single-panel layout. Try both forms in Open, choose and dismiss.',
      render: BranchPreview,
    },
    {
      id: 'live',
      title: 'Open, choose and dismiss',
      kind: 'behavior',
      mode: 'live',
      overlayStage: true,
      reset: true,
      caption:
        'View options keeps checkbox changes open and closes on a sort choice. File actions opens the guide, copies its link or reports a command request. Export as opens beside the menu when space permits and in place on touch or in a narrow area.',
      render: LiveExamples,
    },
    {
      id: 'overflow',
      title: 'Long content and scrolling',
      kind: 'content',
      mode: 'live',
      overlayStage: true,
      reset: true,
      caption:
        'Compare wrapping and complete shortcut hints in the capped panel. Open Move to folder and use End, Home or type a folder name to reach a destination.',
      render: Overflow,
    },
  ],
  compositions: [
    {
      id: 'toolbar',
      title: 'Document commands',
      mode: 'live',
      reset: true,
      caption:
        'Open the published document’s actions with a tap or arrow key. Rename and Export PDF report their requests and return focus to the button.',
      render: ({ ctx }) => (
        <DocumentToolbar menuProps={{ panelAttributes: ctx.subject }} triggerProps={ctx.subject} />
      ),
      code: toolbarSource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
