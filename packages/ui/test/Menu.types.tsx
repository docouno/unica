import { createRef } from 'react';
import {
  ContextMenu,
  ContextMenuTrigger,
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
} from '../src/index.js';
import type { ContextMenuInvocation, MenuProps } from '../src/server.js';

const trigger = createRef<HTMLButtonElement>();
const link = createRef<HTMLAnchorElement>();
const panel = createRef<HTMLDivElement>();
const row = createRef<HTMLTableRowElement>();
const open: MenuProps['onOpenChange'] = (next) => void next;
const invoke = ({ source, selection }: ContextMenuInvocation): void => {
  void source.localName;
  void selection.trim();
};

export const menu = (
  <Menu ref={trigger} onOpenChange={open} size="s">
    <MenuTrigger ref={trigger}>Actions</MenuTrigger>
    <MenuContent ref={panel} align="end">
      <MenuGroup>
        <MenuLabel>Commands</MenuLabel>
        <MenuItem ref={trigger} onClick={(event) => void event.currentTarget.disabled}>
          Rename
        </MenuItem>
        <MenuItem
          href="/record"
          ref={link}
          target="_blank"
          onClick={(event) => void event.currentTarget.href}
        >
          Open
        </MenuItem>
      </MenuGroup>
      <MenuSeparator ref={panel} />
      <MenuCheckboxItem checked={undefined} defaultChecked onCheckedChange={(next) => void next}>
        Preview
      </MenuCheckboxItem>
      <MenuRadioGroup value={null} onValueChange={(value) => void value.trim()}>
        <MenuRadioItem value="">Default</MenuRadioItem>
      </MenuRadioGroup>
      <MenuSub ref={trigger}>
        <MenuSubTrigger>Export</MenuSubTrigger>
        <MenuSubContent ref={panel} backLabel="Return">
          <MenuItem>PDF</MenuItem>
        </MenuSubContent>
      </MenuSub>
    </MenuContent>
  </Menu>
);

export const context = (
  <ContextMenu onInvoke={invoke} longPress shouldOpen={(gesture) => !gesture.native}>
    <ContextMenuTrigger ref={row} onContextMenu={(event) => void event.currentTarget.cells}>
      <tr>
        <td>
          <MenuTrigger>Record actions</MenuTrigger>
          <MenuContent />
        </td>
      </tr>
    </ContextMenuTrigger>
  </ContextMenu>
);

export const material = (
  // @ts-expect-error The active theme controls the material.
  <Menu appearance="glass">
    <MenuTrigger>Actions</MenuTrigger>
  </Menu>
);
// @ts-expect-error Menu owns the role of its content.
export const role = <MenuContent role="dialog" />;
// @ts-expect-error Menu actions never act as form submitters.
export const submit = <MenuItem type="submit">Save</MenuItem>;
export const wrongRef = (
  // @ts-expect-error A link requires an anchor ref.
  <MenuItem href="/record" ref={trigger}>
    Open
  </MenuItem>
);
// @ts-expect-error Only command items can be links.
export const choiceLink = <MenuCheckboxItem href="/record">Preview</MenuCheckboxItem>;
// @ts-expect-error Every radio item needs its own value.
export const missingValue = <MenuRadioItem>Default</MenuRadioItem>;
// @ts-expect-error Open geometry is supplied by the real carrier.
export const preview = <MenuSubContent previewOpen />;

// @ts-expect-error Menu owns its item ARIA state even in JSX.
export const checkedCommand = <MenuItem aria-checked="true">Rename</MenuItem>;
// @ts-expect-error A submenu takes its name from the branch label.
export const unnamedBranch = <MenuSubContent aria-label="Other name" />;
export const customData = <MenuContent {...{ 'data-example': 'commands' }} />;
