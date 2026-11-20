import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  CopyIcon,
  CursorIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Checkbox } from '../../prototypes/binary-controls/binary-controls.proto.js';
import { IconButton } from '../../prototypes/button/button.proto.js';
import { Card } from '../../prototypes/card/card.proto.js';
import { Icon } from '@docouno/unica';
import { Input } from '../../prototypes/input/input.proto.js';
import { Link } from '../../prototypes/link/link.proto.js';
import { Text } from '../../prototypes/text/text.proto.js';
import { ContextMenu } from '../../prototypes/menu/context-menu.proto.js';
import type { MenuEntry } from '../../prototypes/menu/menu.entries.js';
import { MenuPreview } from '../../prototypes/menu/menu.proto.js';
import '../../prototypes/menu/context-menu.examples.css';

const fileName = 'Invoice draft';
const actions: readonly MenuEntry[] = [
  { id: 'rename', label: 'Rename', icon: PencilSimpleIcon, shortcut: 'F2' },
  { id: 'copy', label: 'Copy file link', icon: CopyIcon },
  {
    id: 'export',
    label: 'Export PDF',
    icon: DownloadSimpleIcon,
    disabled: true,
    description: 'Publish the draft first',
  },
  { id: 'divider', type: 'separator' },
  { id: 'trash', label: 'Move to trash', icon: TrashIcon, tone: 'danger' },
];

function FileIdentity({
  name,
  children,
}: {
  readonly name: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="context-study-file">
      <span className="context-study-file-icon">
        <Icon icon={FileTextIcon} size="m" />
      </span>
      <span className="context-study-file-name">{name}</span>
      {children}
    </div>
  );
}

function Placement(): ReactElement {
  return (
    <div className="context-study-matrix">
      {(['point', 'button'] as const).map((mode) => (
        <div key={mode} className="context-study-pin" data-origin={mode}>
          <Text size="caption-l" color="secondary">
            {mode === 'point' ? 'Pointer anchor · pinned' : 'Actions button · pinned'}
          </Text>
          <Card
            className="context-study-target"
            size="s"
            data-surface="base"
            data-context-open={mode === 'point' ? 'point' : undefined}
            inert
          >
            <FileIdentity name={fileName}>
              <IconButton
                size="s"
                variant="ghost"
                icon={DotsThreeIcon}
                aria-label="File actions"
                aria-expanded="true"
              />
            </FileIdentity>
          </Card>
          <div className="context-study-pin-menu">
            {mode === 'point' && (
              <Icon icon={CursorIcon} directional className="context-study-cursor" />
            )}
            <MenuPreview label={`${fileName} actions`} size="s" items={actions} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InspectFile({ touch = false }: { readonly touch?: boolean }): ReactElement {
  const [notice, setNotice] = useState('');
  const items: readonly MenuEntry[] = actions.map((item) => ({
    ...item,
    run: () => setNotice(`${'label' in item ? item.label : ''} · ${fileName}`),
  }));
  return (
    <div className="context-study-live" data-menu-boundary>
      <Text color="secondary" size="caption-l" role="status" dir="auto">
        {notice ||
          (touch
            ? 'On a touch screen, hold the file tile or tap its actions button.'
            : 'Right-click the file. When it has focus, try Shift+F10.')}
      </Text>
      <ContextMenu
        label={`${fileName} actions`}
        items={items}
        size="s"
        align="end"
        longPress={touch}
        trigger={(props) => (
          <IconButton
            {...props}
            size="s"
            variant="ghost"
            icon={DotsThreeIcon}
            className="context-study-trigger"
            aria-label={`Actions for ${fileName}`}
          />
        )}
        target={(bindings, trigger, panel) => (
          <Card
            {...bindings}
            className="context-study-target context-study-live-target"
            size="s"
            data-surface="base"
            role="group"
            data-touch-hold={touch || undefined}
            tabIndex={0}
            aria-label={fileName}
          >
            <FileIdentity name={fileName}>{trigger}</FileIdentity>
            {panel}
          </Card>
        )}
      />
    </div>
  );
}

function NativeBehavior(): ReactElement {
  const [allowSelection, setAllowSelection] = useState(false);
  const [selection, setSelection] = useState('');
  const [notice, setNotice] = useState('');
  const items: readonly MenuEntry[] = [
    {
      id: 'copy',
      label: 'Copy selected text',
      icon: CopyIcon,
      disabled: !selection,
      run: () => setNotice(`Selected text: ${selection}`),
    },
    {
      id: 'rename',
      label: 'Rename document',
      icon: PencilSimpleIcon,
      run: () => setNotice('Rename requested for release notes.'),
    },
  ];
  return (
    <div className="context-study-live" data-menu-boundary>
      <Checkbox
        size="s"
        label="Use document actions for selected text"
        checked={allowSelection}
        onChange={(event) => setAllowSelection(event.currentTarget.checked)}
      />
      <ContextMenu
        label="Release notes actions"
        items={items}
        size="s"
        align="end"
        shouldOpen={(context) =>
          !context.native ||
          Boolean(
            allowSelection &&
            context.selection &&
            context.source.closest('.context-study-selection'),
          )
        }
        onInvoke={(context) => setSelection(context.selection)}
        trigger={(props) => (
          <IconButton
            {...props}
            size="s"
            variant="ghost"
            icon={DotsThreeIcon}
            className="context-study-trigger"
            aria-label="Release notes actions"
          />
        )}
        target={(bindings, trigger, panel) => (
          <Card
            {...bindings}
            className="context-study-target context-study-live-target context-study-note"
            size="s"
            data-surface="base"
          >
            <FileIdentity name="Release notes">{trigger}</FileIdentity>
            <Text className="context-study-selection" size="body-s" color="secondary" dir="auto">
              Select part of this sentence and right-click it.
            </Text>
            <Input size="s" label="Revision note" defaultValue="Fixes in this release" />
            <Link href="?item=04-document-reader">Open the source document</Link>
            {panel}
          </Card>
        )}
      />
      {notice && (
        <Text color="secondary" size="caption-l" role="status" dir="auto">
          {notice}
        </Text>
      )}
    </div>
  );
}

export default defineComponent({
  id: 'context-menu',
  title: 'ContextMenu',
  category: 'Overlays',
  status: 'Proto',
  props: {
    size: {
      kind: 'enum',
      group: 'Menu',
      default: 's',
      description: 'Density of the menu rows.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    align: {
      kind: 'enum',
      group: 'Menu',
      default: 'end',
      description: 'Logical alignment when opened from a control.',
      choices: [{ value: 'start' }, { value: 'end' }],
    },
    longPress: {
      kind: 'boolean',
      group: 'Behavior',
      default: false,
      description: 'Allow touch hold to open the context menu.',
    },
    onInvoke: {
      kind: 'action',
      group: 'Events',
      description: 'Reports the invocation method.',
      code: 'handleInvoke',
    },
    onCommand: {
      kind: 'action',
      group: 'Events',
      description: 'Reports a selected item.',
      code: 'handleCommand',
    },
  },
  code: (
    values,
  ) => `<ContextMenu label="Invoice draft actions" items={items} size="${values.size}"${values.align === 'start' ? '' : ' align="end"'}${values.longPress ? ' longPress' : ''} onInvoke={handleInvoke}
  trigger={(bindings) => <IconButton {...bindings} icon={DotsThreeIcon} aria-label="File actions" />}
  target={(bindings, trigger, panel) => (
    <Card {...bindings} tabIndex={0}>
      <FileIdentity name="Invoice draft">{trigger}</FileIdentity>
      {panel}
    </Card>
  )}
/>`,
  render: ({ values, ctx }) => (
    <ContextMenu
      label={`${fileName} actions`}
      size={values.size}
      align={values.align}
      longPress={values.longPress}
      panelAttributes={ctx.subject}
      items={actions.map((entry) => ({
        ...entry,
        run: () => ctx.action('onCommand')(entry.id),
      }))}
      onInvoke={({ kind }) => ctx.action('onInvoke')(kind)}
      trigger={(bindings) => (
        <IconButton
          {...bindings}
          size="s"
          variant="ghost"
          icon={DotsThreeIcon}
          aria-label="File actions"
        />
      )}
      target={(bindings, trigger, panel) => (
        <Card
          {...bindings}
          {...ctx.subject}
          className="context-study-target context-study-live-target"
          size="s"
          data-surface="base"
          role="group"
          data-touch-hold={values.longPress || undefined}
          tabIndex={0}
          aria-label={fileName}
        >
          <FileIdentity name={fileName}>{trigger}</FileIdentity>
          {panel}
        </Card>
      )}
    />
  ),
  cases: [
    {
      id: 'placement',
      title: 'One menu, two anchors',
      overlayStage: true,
      kind: 'behavior',
      render: () => <Placement />,
    },
    {
      id: 'invoke',
      title: 'Pointer and keyboard',
      overlayStage: true,
      kind: 'behavior',
      render: () => <InspectFile />,
    },
    {
      id: 'touch',
      title: 'Touch and opt-in hold',
      overlayStage: true,
      kind: 'behavior',
      render: () => <InspectFile touch />,
    },
  ],
  usage: [
    {
      id: 'native',
      title: 'Links, fields and selection',
      overlayStage: true,
      code: `<ContextMenu label="Text actions" items={items} shouldOpen={shouldOpen}
  trigger={(bindings) => <IconButton {...bindings} icon={DotsThreeIcon} aria-label="Text actions" />}
  target={(bindings, trigger, panel) => (
    <Card {...bindings}>
      <Input label="Reference name" />
      {trigger}
      {panel}
    </Card>
  )}
/>`,
      render: () => <NativeBehavior />,
    },
  ],
});
