import type { JSX, MouseEvent } from 'react';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import type { ControlSize } from '../../core/forms/fieldAxes.js';
import type { CollectionEntry, Row } from './collection.js';
import { ListboxGroup, ListboxOption } from './ListboxParts.js';
import type { PickerSelection } from './usePickerSelection.js';
import type { PickerNavigation } from './usePickerNavigation.js';

interface Props {
  readonly entries: readonly CollectionEntry[];
  readonly selection: PickerSelection;
  readonly navigation: PickerNavigation;
  readonly size: ControlSize;
  readonly onChoose: (row: Row, host: HTMLElement) => void;
  readonly keepFocus?: boolean | undefined;
}

export function PickerRows({
  entries,
  selection,
  navigation,
  size,
  onChoose,
  keepFocus,
}: Props): JSX.Element {
  const reserveIconSpace = entries.some((entry) =>
    'options' in entry
      ? entry.options.some((row) => row.iconLeft !== undefined)
      : entry.iconLeft !== undefined,
  );
  function renderRow(row: Row): JSX.Element {
    const props = row.props;
    return (
      <ListboxOption
        {...props}
        key={`row:${row.value}`}
        id={navigation.rowIds.get(row.value)}
        value={row.value}
        label={row.label}
        description={row.description}
        iconLeft={row.iconLeft}
        size={size}
        reserveIconSpace={reserveIconSpace}
        selected={selection.selected.has(row.value)}
        active={row.value === navigation.active}
        disabled={selection.disabled || row.disabled}
        onMouseDown={composeEventHandlers(
          props?.onMouseDown,
          (event: MouseEvent<HTMLDivElement>) => {
            if (keepFocus && event.button === 0) {
              event.preventDefault();
            }
          },
        )}
        onClick={composeEventHandlers(props?.onClick, (event: MouseEvent<HTMLDivElement>) => {
          if (event.button === 0 && !selection.isUnavailable(event.currentTarget)) {
            onChoose(row, event.currentTarget);
          }
        })}
      />
    );
  }
  return (
    <>
      {entries.map((entry) =>
        'options' in entry
          ? entry.options.length > 0 && (
              <ListboxGroup {...entry.props} key={`group:${entry.key}`} label={entry.label}>
                {entry.options.map(renderRow)}
              </ListboxGroup>
            )
          : renderRow(entry),
      )}
    </>
  );
}
