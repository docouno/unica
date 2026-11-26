import { StrictMode, useRef, useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { flushSync } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import {
  Button,
  Listbox,
  ListboxGroup,
  ListboxOption,
  Select,
  SelectContent,
  SelectGroup,
  SelectOption,
  SelectTrigger,
} from '@docouno/unica';
import type { ListboxItem, PickerMessages } from '@docouno/unica';

const roleOptions: readonly ListboxItem[] = [
  { value: 'a', label: 'Alpha', description: 'Organization owner' },
  { value: 'b', label: 'Beta' },
  { value: 'be', label: 'Beacon' },
  { value: 'c', label: 'Charlie' },
  { value: '', label: 'Empty key' },
  { value: 'd', label: 'Delta', disabled: true },
];

function preventSubmit(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault();
}

type PickerValue = string | null | readonly string[];

interface Snapshot {
  readonly phase: string;
  readonly next: PickerValue;
  readonly entries: readonly (readonly [string, FormDataEntryValue])[];
}

function OrderedAnswers(): JSX.Element {
  const form = useRef<HTMLFormElement>(null);
  const [options, setOptions] = useState(roleOptions);
  const [log, setLog] = useState<readonly Snapshot[]>([]);
  const [controlled, setControlled] = useState<string | null>('a');
  const [disableBeta, setDisableBeta] = useState(false);
  const [accept, setAccept] = useState(false);

  function record(phase: string, next: PickerValue): void {
    if (form.current) {
      const entries = [...new FormData(form.current)];
      setLog((previous) => [...previous, { phase, next, entries }]);
    }
  }

  return (
    <form aria-label="Ordered answers" ref={form} onSubmit={preventSubmit}>
      <button
        type="button"
        onClick={() => setOptions(roleOptions.filter(({ value }) => value !== 'a'))}
      >
        Remove Alpha
      </button>
      <button type="button" onClick={() => setOptions(roleOptions)}>
        Restore Alpha
      </button>
      <button type="button" onClick={() => setAccept(true)}>
        Remap controlled answer
      </button>
      <button type="button" onClick={() => setDisableBeta(true)}>
        Disable Beta
      </button>
      <Select
        width="auto"
        aria-label="Ordered roles"
        name="role"
        multiple
        searchable
        options={options}
        defaultValue={['a', 'b']}
        onValueChange={(next) => record('ordered', next)}
      />
      <Listbox
        aria-label="Controlled role"
        name="reviewer"
        value={controlled}
        options={
          disableBeta
            ? roleOptions.map((item) => (item.value === 'b' ? { ...item, disabled: true } : item))
            : roleOptions
        }
        onValueChange={(next) => {
          record('proposed', next);
          if (accept) {
            flushSync(() => setControlled('c'));
            record('remapped', next);
          }
        }}
      />
      <button type="reset">Reset roles</button>
      <output data-testid="picker-answers-log">{JSON.stringify(log)}</output>
    </form>
  );
}

function NativeConstraints(): JSX.Element {
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [external, setExternal] = useState('picker-first-owner');
  const [log, setLog] = useState<readonly PickerValue[]>([]);
  return (
    <>
      <button type="button" onClick={() => setDisabled((value) => !value)}>
        Toggle fieldset
      </button>
      <button type="button" onClick={() => setReadOnly((value) => !value)}>
        Toggle read only
      </button>
      <button type="button" onClick={() => setExternal('picker-second-owner')}>
        Move external owner
      </button>
      <form id="picker-first-owner" aria-label="Native choices" onSubmit={preventSubmit}>
        <label>
          Earlier field
          <input name="earlier" required />
        </label>
        <fieldset disabled={disabled}>
          <legend>
            <Listbox
              aria-label="Legend role"
              name="legend"
              options={roleOptions.slice(0, 2)}
              defaultValue="a"
            />
          </legend>
          <Select
            id="picker-required"
            aria-label="Required role"
            name="required-role"
            width="auto"
            options={roleOptions}
            readOnly={readOnly}
            required
            onValueChange={(next) => setLog((previous) => [...previous, next])}
          />
          <Listbox
            aria-label="Required members"
            name="member"
            options={roleOptions}
            multiple
            required
            readOnly={readOnly}
            onValueChange={(next) => setLog((previous) => [...previous, next])}
          />
        </fieldset>
        <button type="submit">Submit native choices</button>
      </form>
      <form id="picker-second-owner" aria-label="Other owner" onSubmit={preventSubmit} />
      <Select
        aria-label="External picker"
        name="external"
        form={external}
        width="auto"
        options={roleOptions}
        defaultValue="a"
      />
      <output data-testid="picker-constraints-log">{JSON.stringify(log)}</output>
    </>
  );
}

const localized = {
  placeholder: 'Elige',
  searchLabel: 'Buscar',
  clearSearch: 'Borrar búsqueda',
  clearSelection: 'Borrar selección',
  selectedValue: 'Valor elegido',
  readOnly: 'Solo lectura',
  loading: 'Cargando opciones…',
  updating: 'Actualizando opciones…',
  empty: 'No hay opciones',
  unavailableGroup: 'Selecciones no disponibles',
  unavailableOption: 'Opción no disponible',
  removeUnavailable: 'Ya no está disponible · elige para quitar',
  unavailableDescription: 'Ya no está disponible',
  noMatchesHint: 'Prueba otro nombre',
  selectedCount: (count: number) => `${count} elegidos`,
  noMatches: (query: string) => `No se encontró «${query}»`,
  selectionAnnouncement: (labels: readonly string[]) => labels.join(' · '),
} satisfies PickerMessages;

const groupedRoles = [{ label: 'Workspace roles', options: roleOptions }];

function ModalChoices(): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<readonly boolean[]>([]);
  const [submitted, setSubmitted] = useState(0);

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()}>
        Open choices dialog
      </button>
      <dialog ref={dialog} aria-label="Invite collaborator">
        <form
          aria-label="Invite form"
          style={{ inlineSize: 430, paddingInlineEnd: 140 }}
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted((count) => count + 1);
          }}
        >
          <button type="button">Before picker</button>
          <Select
            aria-label="Invite roles"
            name="invite-role"
            multiple
            searchable
            messages={localized}
            options={groupedRoles}
            defaultValue={['a']}
            open={open}
            onOpenChange={(requested) => {
              setRequests((previous) => [...previous, requested]);
              if (requested) {
                setOpen(true);
              }
            }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', insetInlineEnd: 16, insetBlockStart: 52 }}
          >
            After picker
          </button>
          <Select aria-label="Invite kind" name="invite-kind" options={roleOptions} />
          <button type="submit">Submit invite</button>
          <button type="button" onClick={() => dialog.current?.close()}>
            Close invite
          </button>
        </form>
        <output data-testid="picker-modal-requests">{JSON.stringify(requests)}</output>
        <output data-testid="picker-modal-submits">{submitted}</output>
      </dialog>
    </>
  );
}

type CatalogPhase = 'pending' | 'ready' | 'refresh' | 'failed' | 'empty';

function AsyncChoices(): JSX.Element {
  const [phase, setPhase] = useState<CatalogPhase>('pending');
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [searchable, setSearchable] = useState(false);
  const options = phase === 'pending' || phase === 'empty' ? [] : groupedRoles;
  return (
    <>
      <button type="button" onClick={() => setPhase('ready')}>
        Resolve catalog
      </button>
      <button type="button" onClick={() => setPhase('refresh')}>
        Refresh catalog
      </button>
      <button type="button" onClick={() => setPhase('pending')}>
        Reload empty catalog
      </button>
      <button type="button" onClick={() => setPhase('failed')}>
        Fail catalog
      </button>
      <button type="button" onClick={() => setPhase('empty')}>
        Clear catalog
      </button>
      <button type="button" onClick={() => setSearchable(true)}>
        Enable search
      </button>
      <button type="button" onClick={() => setDisabled((value) => !value)}>
        Toggle async disabled
      </button>
      <button type="button" onClick={() => setReadOnly((value) => !value)}>
        Toggle async read only
      </button>
      <form aria-label="Async answers" onSubmit={preventSubmit}>
        <Select
          aria-label="Async roles"
          name="saved"
          width="auto"
          options={options}
          messages={localized}
          selectedLabels={{ a: 'Propietaria guardada' }}
          defaultValue="a"
          searchable={searchable}
          clearable={searchable}
          disabled={disabled}
          readOnly={readOnly}
          status="danger"
          loading={phase === 'pending' || phase === 'refresh'}
          errorState={
            phase === 'failed' ? (
              <div>
                No se cargó el catálogo
                <Button type="button" onClick={() => setPhase('ready')}>
                  Reintentar
                </Button>
              </div>
            ) : undefined
          }
        />
        <button type="button" style={{ marginBlockStart: 120 }}>
          After async picker
        </button>
      </form>
    </>
  );
}

const geometryOptions = Array.from({ length: 38 }, (_, index) => ({
  value: String(index),
  label: index === 20 ? 'Target result' : `Option ${index + 1}`,
}));

function GeometryChoices(): JSX.Element {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setVisible(false)}>
        Remove anchor
      </button>
      <div
        data-testid="positioned-anchor"
        style={{
          marginBlockStart: 'max(12px, calc(840px - 70vh))',
          inlineSize: 180,
          marginInlineStart: 32,
        }}
      >
        {visible && (
          <Select
            aria-label="Positioned choices"
            name="positioned"
            searchable
            options={geometryOptions}
            defaultValue="37"
          />
        )}
        <button type="button">After positioned picker</button>
      </div>
      <div style={{ inlineSize: 135 }}>
        <Select
          aria-label="Long saved choices"
          multiple
          options={roleOptions}
          defaultValue={['a', 'b', 'be', 'c', 'd']}
        />
      </div>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Listbox
          key={size}
          aria-label={`Row size ${size}`}
          size={size}
          options={[{ value: 'one', label: 'One' }]}
          defaultValue="one"
        />
      ))}
    </>
  );
}

export function PickerSsrFields(): JSX.Element {
  return (
    <form aria-label="Server choices" onSubmit={preventSubmit}>
      <label htmlFor="picker-ssr-trigger">Backup roles</label>
      <Select
        id="picker-ssr-trigger"
        name="backup"
        multiple
        defaultValue={['b', '']}
        selectedLabels={{ b: 'Backup beta', '': 'Backup empty' }}
        messages={localized}
      >
        <SelectTrigger />
        <SelectContent />
      </Select>
      <Select aria-label="Compound choice" name="compound" defaultValue="" required>
        <SelectTrigger />
        <SelectContent>
          <>
            <SelectGroup label="First group">
              <SelectOption value="" label="Empty key" />
            </SelectGroup>
            <SelectGroup label="First group">
              <SelectOption value="b" label="Beta" />
            </SelectGroup>
          </>
        </SelectContent>
      </Select>
      <Listbox aria-label="Compound list" name="role-list" defaultValue="a">
        <ListboxGroup label="First group">
          <ListboxOption value="a" label="Alpha" description="Organization owner" />
        </ListboxGroup>
      </Listbox>
    </form>
  );
}

function HydrationMount(): JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  const hydrated = useRef<Root | null>(null);
  const [errors, setErrors] = useState<readonly string[]>([]);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (container.current && !hydrated.current) {
            hydrated.current = hydrateRoot(
              container.current,
              <StrictMode>
                <PickerSsrFields />
              </StrictMode>,
              {
                onRecoverableError: (error) =>
                  setErrors((previous) => [...previous, String(error)]),
              },
            );
          }
        }}
      >
        Hydrate pickers
      </button>
      <div data-testid="picker-hydration-root" ref={container} />
      <output data-testid="picker-hydration-errors">{errors.join('\n')}</output>
    </>
  );
}

export default function PickerFixtures(): JSX.Element {
  return (
    <>
      <OrderedAnswers />
      <NativeConstraints />
      <ModalChoices />
      <AsyncChoices />
      <HydrationMount />
    </>
  );
}

export { GeometryChoices };
