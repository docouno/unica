import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { ReactElement } from 'react';
import {
  ContextMenu,
  ContextMenuTrigger,
  IconButton,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from '@docouno/unica';

function Dots(): ReactElement {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function Options({
  remove,
  hideExport = false,
  onCommand,
}: {
  readonly remove: boolean;
  readonly hideExport?: boolean | undefined;
  readonly onCommand: (command: string) => void;
}): ReactElement {
  return (
    <>
      {!remove && (
        <MenuItem data-testid="duplicate-command" onClick={() => onCommand('duplicate')}>
          Duplicate
        </MenuItem>
      )}
      <MenuItem style={{ visibility: 'hidden' }}>Invisible command</MenuItem>
      <MenuGroup inert>
        <MenuItem>Inert command</MenuItem>
      </MenuGroup>
      <MenuItem
        tone="danger"
        disabled
        description="Locked by the owner"
        onClickCapture={() => onCommand('disabled-capture')}
        onDoubleClick={() => onCommand('disabled-double-click')}
      >
        Delete
      </MenuItem>
      <MenuItem href="#destination" shortcut="⇧⌘O">
        Open record
      </MenuItem>
      <MenuSeparator />
      <MenuGroup aria-labelledby="missing-view">
        <MenuLabel>View</MenuLabel>
        <MenuCheckboxItem defaultChecked>Preview</MenuCheckboxItem>
      </MenuGroup>
      <MenuRadioGroup defaultValue="date">
        <MenuLabel>Sort</MenuLabel>
        <MenuRadioItem value="date">Date</MenuRadioItem>
        <MenuRadioItem value="">Name</MenuRadioItem>
      </MenuRadioGroup>
      <MenuGroup data-testid="export-group">
        <MenuSub>
          <MenuSubTrigger
            data-testid="export-branch"
            hidden={hideExport}
            description="Available file types"
          >
            Export
          </MenuSubTrigger>
          <div data-testid="export-panel-wrapper">
            <MenuSubContent style={{ inlineSize: 240 }}>
              <MenuItem onClick={() => onCommand('pdf')}>PDF</MenuItem>
              <MenuSub>
                <MenuSubTrigger>Advanced formats</MenuSubTrigger>
                <MenuSubContent style={{ inlineSize: 320 }}>
                  <MenuCheckboxItem>Include notes</MenuCheckboxItem>
                  <MenuItem>Markdown</MenuItem>
                </MenuSubContent>
              </MenuSub>
            </MenuSubContent>
          </div>
        </MenuSub>
      </MenuGroup>
    </>
  );
}

export default function MenuFixture(): ReactElement {
  const [events, setEvents] = useState<string[]>([]);
  const [remove, setRemove] = useState(false);
  const [hideExport, setHideExport] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [rename, setRename] = useState(false);
  const [controlled, setControlled] = useState(false);
  const [showControlled, setShowControlled] = useState(true);
  const [openModalOnClose, setOpenModalOnClose] = useState(false);
  const controlledPanel = useRef<HTMLDivElement>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [radio, setRadio] = useState<string | null>(null);
  const [acceptRadio, setAcceptRadio] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const commandDialog = useRef<HTMLDialogElement>(null);
  const record = (event: string): void => setEvents((previous) => [...previous, event]);
  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          record('submit');
        }}
        onReset={() => record('reset')}
      >
        <input name="title" aria-label="Before menu" />
        <span id="name-one">Record</span>
        <span id={rename ? 'name-updated' : 'name-two'}>{rename ? 'tools' : 'actions'}</span>
        <Menu onOpenChange={(open) => record(`main:${open}`)}>
          <MenuTrigger asChild>
            <IconButton
              key={rename ? 'renamed' : 'original'}
              icon={Dots}
              aria-labelledby={`name-one ${rename ? 'name-updated' : 'name-two'}`}
            />
          </MenuTrigger>
          {showContent && (
            <details open data-testid="record-menu-content">
              <summary hidden>Record menu</summary>
              <MenuContent>
                <Options remove={remove} hideExport={hideExport} onCommand={record} />
                <MenuItem onClick={(event) => event.preventDefault()}>Cancel activation</MenuItem>
                <MenuItem onClick={() => commandDialog.current?.showModal()}>
                  Review deletion
                </MenuItem>
              </MenuContent>
            </details>
          )}
        </Menu>
        <input aria-label="After menu" />
        <button type="button" onClick={() => setRemove(true)} data-testid="remove-item">
          Remove item
        </button>
        <button type="button" onClick={() => setRename(true)} data-testid="rename-trigger">
          Rename trigger
        </button>
      </form>
      <button type="button" onClick={() => setHideExport(true)}>
        Hide export trigger
      </button>
      <button type="button" onClick={() => setShowContent((shown) => !shown)}>
        Toggle record panel
      </button>
      <div id="destination">Record destination</div>
      <button type="button" onClick={() => setControlled(true)}>
        Set controlled true
      </button>
      <button type="button" onClick={() => setControlled(false)}>
        Set controlled false
      </button>
      <button
        type="button"
        onClick={() => {
          setControlled(false);
          setShowControlled(false);
        }}
      >
        Remove closed controlled panel
      </button>
      <button type="button" onClick={() => setAcceptRadio(true)}>
        Accept radio choice
      </button>
      <button type="button" onClick={() => setOpenModalOnClose(true)}>
        Open dialog on close request
      </button>
      <button
        type="button"
        onClick={() => {
          controlledPanel.current?.hidePopover();
          flushSync(() => setControlled(false));
          flushSync(() => setControlled(true));
        }}
      >
        Replace native opening
      </button>
      <Menu
        open={controlled}
        onOpenChange={(open) => {
          record(`controlled:${open}`);
          if (!open && openModalOnClose && !commandDialog.current?.open) {
            commandDialog.current?.showModal();
          }
        }}
      >
        <MenuTrigger>Controlled actions</MenuTrigger>
        {showControlled && (
          <div data-testid="controlled-menu-content">
            <MenuContent ref={controlledPanel}>
              <MenuItem onClick={() => record('controlled-command')}>Run command</MenuItem>
              <MenuRadioGroup
                value={radio}
                onValueChange={(value) => {
                  record(`radio:${JSON.stringify(value)}`);
                  if (acceptRadio) {
                    setRadio(value);
                  }
                }}
              >
                <MenuLabel>Choose</MenuLabel>
                <MenuRadioItem value="">Empty key</MenuRadioItem>
                <MenuRadioItem value="x">Other key</MenuRadioItem>
              </MenuRadioGroup>
              <MenuItem
                onClick={() => {
                  commandDialog.current?.showModal();
                  setShowControlled(false);
                }}
              >
                Review and remove panel
              </MenuItem>
            </MenuContent>
          </div>
        )}
      </Menu>
      <button type="button" onClick={() => dialog.current?.showModal()}>
        Open dialog
      </button>
      <dialog ref={dialog} aria-label="Review records" style={{ padding: 20, margin: 16 }}>
        <Menu>
          <MenuTrigger>Dialog actions</MenuTrigger>
          <MenuContent>
            <Options remove={false} onCommand={record} />
          </MenuContent>
        </Menu>
      </dialog>
      <dialog ref={commandDialog} aria-label="Confirm deletion">
        <button type="button">Confirm</button>
      </dialog>
      <table>
        <tbody>
          {['Alpha', 'Beta'].map((item) => (
            <ContextMenu
              key={item}
              longPress
              shouldOpen={(invocation) => {
                record(`policy:${item}:${invocation.native}`);
                return !invocation.native || invocation.source.matches('video[data-test-policy]');
              }}
              onInvoke={({ kind, selection }) => record(`invoke:${item}:${kind}:${selection}`)}
              onOpenChange={(open) => record(`context:${item}:${open}`)}
            >
              <ContextMenuTrigger>
                <tr data-testid={item}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${item}`}
                      defaultChecked={item === 'Alpha'}
                    />
                  </td>
                  <th scope="row">
                    <span tabIndex={0}>{item}</span>
                  </th>
                  <td>
                    <a href="#destination">Record link {item}</a>
                  </td>
                  <td data-native-context-region="">
                    <input aria-label={`Note ${item}`} />
                  </td>
                  <td>
                    <MenuTrigger asChild>
                      <IconButton icon={Dots} aria-label={`Actions for ${item}`} />
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem onClick={() => record(`run:${item}`)}>{`Rename ${item}`}</MenuItem>
                      <MenuItem href="#destination">{`View ${item}`}</MenuItem>
                      <MenuSub>
                        <MenuSubTrigger>{`Export ${item}`}</MenuSubTrigger>
                        <MenuSubContent>
                          <MenuItem>{`Format ${item}`}</MenuItem>
                        </MenuSubContent>
                      </MenuSub>
                    </MenuContent>
                  </td>
                </tr>
              </ContextMenuTrigger>
            </ContextMenu>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => setContextOpen(true)}>
        Open context programmatically
      </button>
      <ContextMenu
        open={contextOpen}
        longPress
        shouldOpen={(invocation) => {
          record(`outer-policy:${invocation.kind}`);
          return invocation.kind !== 'keyboard' && !invocation.native;
        }}
        onInvoke={({ kind, selection }) => record(`outer-invoke:${kind}:${selection}`)}
        onOpenChange={(open) => record(`outer-open:${open}`)}
      >
        <ContextMenuTrigger>
          <section aria-label="Outer object">
            <span tabIndex={0}>Outer title</span>
            <ContextMenu
              shouldOpen={() => {
                record('inner-policy');
                return false;
              }}
            >
              <ContextMenuTrigger>
                <div>
                  <span>Inner title</span>
                  <MenuTrigger>Inner actions</MenuTrigger>
                  <MenuContent>
                    <MenuItem>Rename inner</MenuItem>
                  </MenuContent>
                </div>
              </ContextMenuTrigger>
            </ContextMenu>
            <MenuTrigger>Outer actions</MenuTrigger>
            <MenuContent>
              <MenuItem>Rename outer</MenuItem>
            </MenuContent>
          </section>
        </ContextMenuTrigger>
      </ContextMenu>
      <Menu>
        <MenuTrigger title="Icon actions">
          <Dots />
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Open tools</MenuItem>
        </MenuContent>
      </Menu>
      <Menu>
        <MenuTrigger>
          <img
            alt="Image actions"
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          />
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Open image</MenuItem>
        </MenuContent>
      </Menu>
      <output data-testid="events">{JSON.stringify(events)}</output>
      <div style={{ height: 640 }} />
    </>
  );
}
