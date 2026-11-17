import type { GlyphComponent } from '../icon/icon.proto.js';

export type MenuSize = 's' | 'm' | 'l';

interface Entry {
  readonly id: string;
  readonly label: string;
  readonly icon?: GlyphComponent;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly preview?: 'hover' | 'pressed' | 'focus' | 'expanded';
}

type Command = Entry & {
  readonly type?: 'action';
  readonly tone?: 'danger';
  readonly shortcut?: string;
  readonly keyShortcuts?: string;
  readonly run?: () => void;
};
type Link = Entry & {
  readonly type: 'link';
  readonly href: string;
  readonly shortcut?: string;
  readonly keyShortcuts?: string;
};
type Choice = Entry & {
  readonly type: 'checkbox' | 'radio';
  readonly checked: boolean;
  readonly run?: () => void;
};
export type MenuBranch = Entry & {
  readonly type: 'branch';
  readonly items: readonly MenuEntry[];
};
export type MenuRow = Command | Link | Choice | MenuBranch;
export type MenuEntry =
  | MenuRow
  | { readonly id: string; readonly type: 'separator' }
  | {
      readonly id: string;
      readonly type: 'group';
      readonly label: string;
      readonly items: readonly MenuRow[];
    };

export function menuRows(items: readonly MenuEntry[]): readonly MenuRow[] {
  return items.flatMap((item) =>
    item.type === 'separator' ? [] : item.type === 'group' ? item.items : [item],
  );
}
