import { Children, Fragment, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { warnOnce } from '../../core/devWarning.js';
import type {
  ListboxGroupProps,
  ListboxItem,
  ListboxOptionProps,
  ListboxSection,
} from './types.js';

export interface Row extends ListboxItem {
  readonly props?: ListboxOptionProps | undefined;
  readonly unavailable?: boolean | undefined;
}

export interface Group {
  readonly label: string;
  readonly options: readonly Row[];
  readonly props?: ListboxGroupProps | undefined;
  readonly key: string;
}

export type CollectionEntry = Row | Group;

export interface Catalog {
  readonly entries: readonly CollectionEntry[];
  readonly byValue: ReadonlyMap<string, Row>;
}

export function visitParts(
  children: ReactNode,
  visit: (child: ReactElement, path: readonly string[]) => void,
  parents: readonly string[] = [],
): void {
  for (const [index, child] of Children.toArray(children).entries()) {
    if (!isValidElement<{ children?: ReactNode }>(child)) {
      warnOnce('picker-part', 'A picker collection accepts only its Option and Group parts.');
      continue;
    }
    const path = [...parents, child.key ?? String(index)];
    if (child.type === Fragment) {
      visitParts(child.props.children, visit, path);
    } else {
      visit(child, path);
    }
  }
}

export function createCatalog(
  options: readonly (ListboxItem | ListboxSection)[] | undefined,
  children: ReactNode,
  Option: ReactElement['type'],
  GroupPart: ReactElement['type'],
): Catalog {
  const entries: CollectionEntry[] = [];
  const byValue = new Map<string, Row>();
  function add(row: Row, target: Row[] | CollectionEntry[]): void {
    if (byValue.has(row.value)) {
      warnOnce('picker-duplicate-option', 'Picker option values must be unique. The first wins.');
      return;
    }
    byValue.set(row.value, row);
    target.push(row);
  }
  if (options !== undefined) {
    visitParts(children, () => {
      warnOnce(
        'picker-mixed-sources',
        'Provide picker options or declarative options, never both.',
      );
    });
    for (const [index, item] of options.entries()) {
      if ('options' in item) {
        const rows: Row[] = [];
        for (const row of item.options) {
          add(row, rows);
        }
        entries.push({ label: item.label, options: rows, key: `data:${index}` });
      } else {
        add(item, entries);
      }
    }
  } else {
    visitParts(children, (child, path) => {
      if (child.type === Option) {
        const props = child.props as ListboxOptionProps;
        add({ ...props, props }, entries);
      } else if (child.type === GroupPart) {
        const props = child.props as ListboxGroupProps;
        const rows: Row[] = [];
        visitParts(props.children, (option) => {
          if (option.type === Option) {
            const row = option.props as ListboxOptionProps;
            add({ ...row, props: row }, rows);
          } else {
            warnOnce('picker-group-part', 'Picker groups accept only their Option parts.');
          }
        });
        entries.push({
          label: props.label,
          props,
          options: rows,
          key: `jsx:${JSON.stringify(path)}`,
        });
      } else {
        warnOnce('picker-part', 'A picker collection accepts only its Option and Group parts.');
      }
    });
  }
  return { entries, byValue };
}

function normalizeText(text: string): string {
  return text.normalize('NFC').toLowerCase();
}

export function filterEntries(
  entries: readonly CollectionEntry[],
  query: string,
): readonly CollectionEntry[] {
  const term = normalizeText(query.trim());
  if (!term) {
    return entries;
  }
  const matches = (row: Row): boolean =>
    normalizeText(row.label).includes(term) ||
    (row.description !== undefined && normalizeText(row.description).includes(term));
  return entries.flatMap((entry): CollectionEntry[] => {
    if (!('options' in entry)) {
      return matches(entry) ? [entry] : [];
    }
    if (normalizeText(entry.label).includes(term)) {
      return [entry];
    }
    const options = entry.options.filter(matches);
    return options.length ? [{ ...entry, options }] : [];
  });
}
