import { useState } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import {
  Chip,
  ChipGroup,
  Popover,
  PopoverTrigger,
  PopoverContent,
  TooltipProvider,
} from '@docouno/unica';
import type { ChipGroupProps, ControlSize } from '@docouno/unica';
import { FolderIcon } from '@phosphor-icons/react/ssr';

const items = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Charlie' },
  { value: 'd', label: 'Delta' },
] as const;

function data(form: HTMLFormElement | null): string {
  return form ? JSON.stringify([...new FormData(form)]) : '[]';
}

export default function ChipFixture(): ReactElement {
  const [value, setValue] = useState<string | null>(null);
  const [accept, setAccept] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<ChipGroupProps['items']>(items);
  const [empty, setEmpty] = useState(false);
  const [alternate, setAlternate] = useState(false);
  const [defaultRequired, setDefaultRequired] = useState(true);
  const [longName, setLongName] = useState('Platform architecture, web applications');
  const record = (event: string) => setLog((events) => [...events, event]);
  const owner = alternate ? 'other-form' : 'external-form';
  const validityItems = empty ? [] : items.slice(0, 2);
  return (
    <TooltipProvider delay={0}>
      <form id="main-form" aria-label="Main form">
        <button type="button" id="before">
          Before radio group
        </button>
        <ChipGroup
          aria-label="Single"
          name="facet"
          style={{ maxInlineSize: '12rem' }}
          items={catalog}
          required
          value={value}
          onValueChange={(next) => {
            const form = document.querySelector<HTMLFormElement>('#main-form');
            const previous = data(form);
            if (accept) {
              flushSync(() => setValue(next));
            }
            record(`single:${next}:${previous}:${data(form)}`);
          }}
        />
        <button type="button" id="after">
          After radio group
        </button>
        <ChipGroup
          multiple
          label="Multi"
          items={catalog}
          name="multi"
          defaultValue={['b']}
          onValueChange={(next) =>
            record(`multi:${next.join(',')}:${data(document.querySelector('#main-form'))}`)
          }
        />
        <Chip
          name="favorite"
          defaultChecked
          onCheckedChange={(next) => record(`favorite:${next}`)}
          onChange={(event) => record(`change:${event.currentTarget.checked}`)}
        >
          Favorite
        </Chip>
        <Chip
          name="locked"
          value=""
          checked={false}
          onCheckedChange={(next) =>
            record(`locked:${next}:${data(document.querySelector('#main-form'))}`)
          }
          onChange={(event) => record(`change:${event.currentTarget.checked}`)}
        >
          Locked value
        </Chip>
        <Chip onCheckedChange={(next) => record(`empty:${next}`)} name="blank" value="">
          Blank value
        </Chip>
      </form>
      <form id="external-form" aria-label="External" />
      <form id="other-form" aria-label="Other" />
      <ChipGroup
        aria-label="External radio"
        name=""
        form={owner}
        items={validityItems}
        defaultValue="a"
        onValueChange={(next) => record(`external:${next}`)}
      />
      <ChipGroup
        aria-label="External multiple"
        multiple
        name="export"
        form={owner}
        items={validityItems}
        defaultValue={['a']}
        onValueChange={(next) => record(`external multi:${next.join(',')}`)}
      />
      <form id="required-form" aria-label="Required form">
        <fieldset id="required-ancestor">
          <ChipGroup
            multiple
            key={String(defaultRequired)}
            label="Required set"
            required
            name="export"
            items={[
              { value: '', label: 'Empty key' },
              { value: 'disabled', label: 'Unavailable', disabled: true },
            ]}
            defaultValue={defaultRequired ? ['', 'disabled'] : ['disabled']}
          />
        </fieldset>
        <button type="submit">Submit required set</button>
      </form>
      <fieldset id="ancestor">
        <legend>
          <Chip form="external-form" name="legend" defaultChecked>
            In first legend
          </Chip>
        </legend>
        <ChipGroup
          multiple
          aria-label="Body group"
          form="external-form"
          name="body"
          required
          items={items.slice(0, 1)}
          defaultValue={['a']}
        />
      </fieldset>
      <button id="accept" type="button" onClick={() => setAccept(true)}>
        Accept changes
      </button>
      <button id="pick-alpha" type="button" onClick={() => setValue('a')}>
        Select Alpha externally
      </button>
      <button id="pick-beta" type="button" onClick={() => setValue('b')}>
        Select Beta externally
      </button>
      <button
        id="disable-beta"
        type="button"
        onClick={() =>
          setCatalog((current) =>
            current.map((item) => ({ ...item, disabled: item.value === 'b' })),
          )
        }
      >
        Disable Beta
      </button>
      <button id="reset-catalog" type="button" onClick={() => setCatalog(items)}>
        Restore options
      </button>
      <button
        id="drop-beta"
        type="button"
        onClick={() => setCatalog(items.filter((item) => item.value !== 'b'))}
      >
        Drop Beta
      </button>
      <button id="reverse" type="button" onClick={() => setCatalog([...items].reverse())}>
        Reverse options
      </button>
      <button
        id="move-beta"
        type="button"
        onClick={() => setCatalog([items[3], items[1], items[2], items[0]])}
      >
        Reorder with Beta in the same position
      </button>
      <button
        id="disable-move-beta"
        type="button"
        onClick={() => setCatalog([items[3], items[2], items[0], { ...items[1], disabled: true }])}
      >
        Reorder and disable Beta
      </button>
      <button id="drop-all" type="button" onClick={() => setCatalog([])}>
        Drop all options
      </button>
      <button id="empty" type="button" onClick={() => setEmpty(!empty)}>
        Toggle external options
      </button>
      <button id="owner" type="button" onClick={() => setAlternate(!alternate)}>
        Change form owner
      </button>
      <button id="required-default" type="button" onClick={() => setDefaultRequired(false)}>
        Start required set empty
      </button>
      <output data-testid="chip-log">{JSON.stringify(log)}</output>
      <Popover>
        <PopoverTrigger>Open full label example</PopoverTrigger>
        <PopoverContent aria-label="Full label example">
          <div id="hint-width" style={{ inlineSize: '9rem' }}>
            <Chip textValue={longName}>
              <strong>{longName}</strong>
            </Chip>
          </div>
          <button
            id="rename"
            type="button"
            onClick={() => setLongName('Platform architecture, data infrastructure')}
          >
            Rename focused choice
          </button>
        </PopoverContent>
      </Popover>
      {(['s', 'm', 'l'] satisfies ControlSize[]).map((size) => (
        <div
          key={size}
          data-testid={`geometry-${size}`}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', inlineSize: 'min(100%, 18rem)' }}
        >
          <Chip size={size} data-testid="plain">
            Research
          </Chip>
          <Chip size={size} data-testid="icon" iconLeft={FolderIcon}>
            Collection
          </Chip>
          <Chip size={size} data-testid="third">
            More material
          </Chip>
          <Chip size={size} data-testid="short">
            S
          </Chip>
        </div>
      ))}
    </TooltipProvider>
  );
}
