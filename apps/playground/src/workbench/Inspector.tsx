import { useCallback, useId, useRef, useState } from 'react';
import type { MouseEvent, ReactElement, ReactNode, SyntheticEvent } from 'react';
import { InspectorCode } from './InspectorCode.js';
import { Matrix } from './Matrix.js';
import { PlaygroundControls } from './PlaygroundControls.js';
import { PlaygroundPanels } from './PlaygroundPanels.js';
import { ViewSettings } from './ViewSettings.js';
import { componentCode, defaultValues, evaluate } from './schema.js';
import type { WorkbenchRoute } from './route.js';
import { useSubjectBounds } from './subjectBounds.js';
import type {
  CaseBlock,
  ComponentDefinition,
  MatrixView,
  PreviewBlock,
  PreviewContext,
  PropValue,
  SceneDefinition,
  Surface,
  SurfaceMode,
  Values,
  WorkbenchConfig,
  WorkbenchTheme,
} from './types.js';
import './inspector.css';

type RenderArtboards = (render: (theme: WorkbenchTheme) => ReactNode) => ReactElement;
type RenderStage = WorkbenchConfig['renderStage'];
type Action = PreviewContext['action'];

export interface InspectorProps {
  readonly component: ComponentDefinition;
  readonly route: WorkbenchRoute;
  readonly themes: readonly WorkbenchTheme[];
  readonly scenes: readonly SceneDefinition[];
  readonly update: (patch: Partial<WorkbenchRoute>, method?: 'push' | 'replace') => void;
  readonly itemHref: (id: string) => string;
  readonly navigateItem: (id: string) => void;
  readonly renderArtboards: RenderArtboards;
  readonly renderStage?: RenderStage;
}

interface StageSettings {
  readonly surface?: Surface;
  readonly overlayStage?: boolean;
}

interface PreviewStageProps {
  readonly theme: WorkbenchTheme;
  readonly comparing: boolean;
  readonly bounds: boolean;
  readonly surfaceMode: SurfaceMode;
  readonly defaultSurface: Surface;
  readonly overlayStage: boolean | undefined;
  readonly renderStage: RenderStage;
  readonly action?: Action | undefined;
  readonly children: (ctx: PreviewContext) => ReactNode;
}

function ignoreAction(): void {}

function PreviewStage({
  theme,
  comparing,
  bounds,
  surfaceMode,
  defaultSurface,
  overlayStage: authoredOverlay,
  renderStage,
  action = () => ignoreAction,
  children,
}: PreviewStageProps): ReactElement {
  const id = useId();
  const scopeRef = useRef<HTMLDivElement>(null);
  useSubjectBounds(scopeRef, bounds);
  const surface = surfaceMode === 'auto' ? defaultSurface : surfaceMode;
  const overlayStage =
    surface === 'overlay' || (surfaceMode === 'auto' && authoredOverlay === true);
  const ctx: PreviewContext = {
    id,
    theme,
    surface,
    comparing,
    subject: { 'data-wb-subject': '' },
    form: { 'data-wb-form': '' },
    action,
  };
  const content = children(ctx);

  return (
    <div
      ref={scopeRef}
      className="wb-inspector-preview"
      onSubmit={(event) => {
        if (event.target instanceof HTMLFormElement && event.target.hasAttribute('data-wb-form')) {
          event.preventDefault();
        }
      }}
    >
      {renderStage ? (
        renderStage({ theme, surface, overlayStage, children: content })
      ) : (
        <div data-surface={surface}>{content}</div>
      )}
    </div>
  );
}

type FormEntries = readonly (readonly [name: string, value: string])[];

interface PlaygroundFormProps {
  readonly kind: ComponentDefinition['form'];
  readonly showCommands: boolean;
  readonly onSubmit: (entries: FormEntries) => void;
  readonly onReset: () => void;
  readonly children: ReactNode;
}

function PlaygroundForm({
  kind,
  showCommands,
  onSubmit,
  onReset,
  children,
}: PlaygroundFormProps): ReactElement {
  const previewRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  if (kind === undefined) {
    return <div className="wb-playground-subject">{children}</div>;
  }

  const findForm = (): HTMLFormElement | undefined => {
    const forms = previewRef.current?.querySelectorAll<HTMLFormElement>('form[data-wb-form]');
    return forms?.length === 1 ? forms[0] : undefined;
  };
  const ownsForm = (target: EventTarget): target is HTMLFormElement =>
    target instanceof HTMLFormElement && target === findForm();

  const handleSubmit = (event: SyntheticEvent<HTMLDivElement>): void => {
    if (!ownsForm(event.target)) {
      return;
    }
    event.preventDefault();
    const entries = [...new FormData(event.target)].map(
      ([name, value]) => [name, typeof value === 'string' ? value : value.name] as const,
    );
    onSubmit(entries);
  };

  const handleReset = (event: SyntheticEvent<HTMLDivElement>): void => {
    if (ownsForm(event.target)) {
      onReset();
    }
  };

  const invokeNativeForm = (operation: 'requestSubmit' | 'reset'): void => {
    const form = findForm();
    if (!form) {
      setError('Mark one form in this example with ctx.form.');
      return;
    }
    setError('');
    // Call the prototype: a form control named "reset" can shadow form.reset.
    HTMLFormElement.prototype[operation].call(form);
  };

  const commandButtons =
    kind === 'wrap' ? (
      <div className="wb-inspector-form-actions">
        <button type="submit" className="wb-action-btn">
          Submit
        </button>
        <button type="reset" className="wb-action-btn">
          Reset
        </button>
      </div>
    ) : (
      <div className="wb-inspector-form-actions">
        <button
          type="button"
          className="wb-action-btn"
          onClick={() => invokeNativeForm('requestSubmit')}
        >
          Submit
        </button>
        <button type="button" className="wb-action-btn" onClick={() => invokeNativeForm('reset')}>
          Reset
        </button>
      </div>
    );

  return (
    <div
      className="wb-playground-subject"
      ref={previewRef}
      onSubmitCapture={handleSubmit}
      onResetCapture={handleReset}
    >
      {kind === 'wrap' ? (
        <form data-wb-form="" className="wb-inspector-wrapped-form">
          {children}
          {showCommands && commandButtons}
        </form>
      ) : (
        <>
          {children}
          {showCommands && commandButtons}
        </>
      )}
      {error && (
        <p role="status" className="wb-inspector-meta">
          {error}
        </p>
      )}
    </div>
  );
}

interface LoggedEvent {
  readonly theme: WorkbenchTheme;
  readonly name: string;
  readonly detail: string | undefined;
}

interface SubmittedData {
  readonly theme: WorkbenchTheme;
  readonly entries: FormEntries;
}

function eventDetail(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof File) {
    return value.name;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

const EVENT_LIMIT = 100;

interface EventLog {
  readonly entries: readonly LoggedEvent[];
  readonly omitted: number;
}

const emptyLog: EventLog = { entries: [], omitted: 0 };

function EventsPanel({
  events,
  onClear,
}: {
  readonly events: EventLog;
  readonly onClear: () => void;
}): ReactElement {
  return (
    <>
      <div className="wb-events-actions">
        <button
          type="button"
          className="wb-action-btn"
          onClick={onClear}
          disabled={!events.entries.length}
        >
          Clear
        </button>
      </div>
      {events.omitted > 0 && (
        <p className="wb-inspector-note">
          {events.omitted} earlier {events.omitted === 1 ? 'event' : 'events'} omitted.
        </p>
      )}
      <div aria-live="polite">
        {events.entries.length ? (
          <ol className="wb-inspector-events" start={events.omitted + 1}>
            {events.entries.map(({ theme, name, detail }, index) => (
              <li key={events.omitted + index}>
                <span>{theme.label}</span> <code>{name}</code>
                {detail !== undefined && <code className="wb-event-detail">{detail}</code>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="wb-inspector-note">No events yet.</p>
        )}
      </div>
    </>
  );
}

function FormDataPanel({
  submissions,
}: {
  readonly submissions: readonly SubmittedData[];
}): ReactElement {
  return (
    <div aria-live="polite">
      {submissions.length ? (
        submissions.map(({ theme, entries }) => (
          <div className="wb-inspector-submission" key={theme.id}>
            <h3>{theme.label}</h3>
            {entries.length ? (
              <dl>
                {entries.map(([name, value], index) => (
                  <div key={index}>
                    <dt>{name}</dt>
                    <dd>{JSON.stringify(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="wb-inspector-note">Empty submission.</p>
            )}
          </div>
        ))
      ) : (
        <p className="wb-inspector-note">Submit an example to inspect its values.</p>
      )}
    </div>
  );
}

const caseKinds: Record<CaseBlock['kind'], string> = {
  behavior: 'Behavior',
  content: 'Content & overflow',
  surface: 'Surface',
};

function PreviewHeading({
  block,
  kind,
}: {
  readonly block: PreviewBlock;
  readonly kind?: CaseBlock['kind'];
}): ReactElement {
  return (
    <header className="wb-inspector-meta wb-block-heading wb-frame-heading" dir="auto">
      <h3>{block.title}</h3>
      {(kind || block.mode) && (
        <span className="wb-inspector-note">
          {kind ? caseKinds[kind] : ''}
          {kind && block.mode ? ' · ' : ''}
          {block.mode === 'live' ? 'Live' : block.mode === 'pinned' ? 'Pinned' : ''}
        </span>
      )}
      {block.caption && (
        <p className="wb-block-caption" dir="auto">
          {block.caption}
        </p>
      )}
    </header>
  );
}

function BlockPicker({
  label,
  blocks,
  selected,
  onSelect,
}: {
  readonly label: string;
  readonly blocks: readonly PreviewBlock[];
  readonly selected: string | undefined;
  readonly onSelect: (id: string | undefined) => void;
}): ReactElement | null {
  if (blocks.length === 0) {
    return null;
  }
  return (
    <label className="wb-block-picker wb-inspector-meta">
      <span>{label}</span>
      <select
        className="wb-field"
        value={selected ?? ''}
        onChange={(event) => onSelect(event.currentTarget.value || undefined)}
      >
        <option value="">All examples</option>
        {blocks.map((block) => (
          <option key={block.id} value={block.id}>
            {block.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function selectBlock<Block extends PreviewBlock>(
  blocks: readonly Block[],
  selected: string | undefined,
): readonly Block[] {
  return selected === undefined ? blocks : blocks.filter(({ id }) => id === selected);
}

interface PlaygroundState {
  readonly values: Values;
  readonly draft: Values;
  readonly numberDrafts: Readonly<Record<string, string>>;
}

function initialState(component: ComponentDefinition): PlaygroundState {
  const values = defaultValues(component.props);
  return { values, draft: values, numberDrafts: {} };
}

export function Inspector({
  component,
  route,
  themes,
  scenes,
  update,
  itemHref,
  navigateItem,
  renderArtboards,
  renderStage,
}: InspectorProps): ReactElement {
  const [playground, setPlayground] = useState(() => initialState(component));
  const [events, setEvents] = useState<EventLog>(emptyLog);
  const [submissions, setSubmissions] = useState<readonly SubmittedData[]>([]);
  const { tab, surface, raw, bounds, block, slice, mode } = route;
  const comparing = themes.length > 1;

  const commitDraft = (state: PlaygroundState, draft: Values): PlaygroundState => ({
    ...state,
    draft,
    values: evaluate(component.constraints, draft).valid ? draft : state.values,
  });
  const updateValue = (key: string, value: PropValue): void => {
    setPlayground((current) => commitDraft(current, { ...current.draft, [key]: value }));
  };
  const updateNumber = (key: string, text: string): void => {
    setPlayground((current) => {
      const state = { ...current, numberDrafts: { ...current.numberDrafts, [key]: text } };
      return text.trim() && Number.isFinite(Number(text))
        ? commitDraft(state, { ...current.draft, [key]: Number(text) })
        : state;
    });
  };
  const report = (theme: WorkbenchTheme, name: string, value?: unknown): void => {
    const entry = { theme, name, detail: eventDetail(value) };
    setEvents(({ entries, omitted }) => ({
      entries: [...entries.slice(1 - EVENT_LIMIT), entry],
      omitted: omitted + Number(entries.length === EVENT_LIMIT),
    }));
  };

  const renderPreview = useCallback(
    (
      theme: WorkbenchTheme,
      identity: string,
      settings: StageSettings | undefined,
      render: (ctx: PreviewContext) => ReactNode,
      surfaceMode: SurfaceMode = surface,
      action?: Action,
    ): ReactElement => (
      <PreviewStage
        key={identity}
        theme={theme}
        comparing={comparing}
        bounds={bounds}
        surfaceMode={surfaceMode}
        defaultSurface={settings?.surface ?? component.defaultSurface ?? 'base'}
        overlayStage={settings?.overlayStage ?? component.overlayStage}
        renderStage={renderStage}
        action={action}
      >
        {render}
      </PreviewStage>
    ),
    [bounds, comparing, component.defaultSurface, component.overlayStage, renderStage, surface],
  );

  const Component = component.render;
  const renderMatrixSubject = useCallback(
    (theme: WorkbenchTheme, values: Values, identity: string, settings?: StageSettings) =>
      renderPreview(theme, identity, settings, (ctx) => <Component values={values} ctx={ctx} />),
    [Component, renderPreview],
  );
  const renderMatrixReference = useCallback(
    (theme: WorkbenchTheme, view: MatrixView) => {
      const Reference = view.reference;
      return Reference
        ? renderPreview(theme, view.id, view, (ctx) => <Reference ctx={ctx} />)
        : null;
    },
    [renderPreview],
  );
  if (tab === 'matrix') {
    return (
      <Matrix
        component={component}
        slice={slice}
        mode={mode}
        raw={raw}
        freeze={route.freeze}
        themes={themes}
        onSliceChange={(selected) => update({ slice: selected }, 'replace')}
        onModeChange={(selected) => update({ mode: selected }, 'replace')}
        renderArtboards={renderArtboards}
        renderSubject={renderMatrixSubject}
        renderReference={renderMatrixReference}
      />
    );
  }

  if (tab === 'cases') {
    const cases = component.cases ?? [];
    return (
      <div className="wb-inspector">
        {!raw && cases.length > 0 && (
          <ViewSettings>
            <BlockPicker
              label="Case"
              blocks={cases}
              selected={block}
              onSelect={(id) => update({ block: id }, 'push')}
            />
          </ViewSettings>
        )}
        {cases.length > 0 ? (
          <div className="wb-inspector-blocks">
            {selectBlock(cases, block).map((item) => {
              const Sample = item.render;
              const surfaces: readonly SurfaceMode[] = item.compareSurfaces
                ? ['base', 'overlay']
                : [surface];
              return (
                <section key={item.id} className="wb-story-frame" data-wb-block={item.id}>
                  <PreviewHeading block={item} kind={item.kind} />
                  {renderArtboards((theme) => (
                    <div className="wb-surface-previews">
                      {surfaces.map((choice) => (
                        <div key={choice} style={{ maxInlineSize: item.width }}>
                          {item.compareSurfaces && (
                            <p className="wb-inspector-meta wb-preview-surface">
                              {choice === 'base' ? 'Base' : 'Overlay'}
                            </p>
                          )}
                          {renderPreview(
                            theme,
                            choice,
                            item,
                            (ctx) => (
                              <Sample ctx={ctx} />
                            ),
                            choice,
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        ) : (
          <p className="wb-inspector-note">No cases registered.</p>
        )}
      </div>
    );
  }

  if (tab === 'usage') {
    const usage = component.usage ?? [];
    const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string): void => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      navigateItem(id);
    };
    return (
      <div className="wb-inspector">
        {!raw && usage.length > 0 && (
          <ViewSettings>
            <BlockPicker
              label="Example"
              blocks={usage}
              selected={block}
              onSelect={(id) => update({ block: id }, 'push')}
            />
          </ViewSettings>
        )}
        {usage.length > 0 ? (
          <div className="wb-inspector-blocks">
            {selectBlock(usage, block).map((item) => {
              const Sample = item.render;
              return (
                <section key={item.id} className="wb-story-frame" data-wb-block={item.id}>
                  <PreviewHeading block={item} />
                  {renderArtboards((theme) =>
                    renderPreview(theme, item.id, item, (ctx) => <Sample ctx={ctx} />),
                  )}
                  {item.code && <InspectorCode code={item.code} />}
                </section>
              );
            })}
          </div>
        ) : (
          renderArtboards((theme) =>
            renderPreview(theme, 'usage-default', undefined, (ctx) => (
              <Component values={defaultValues(component.props)} ctx={ctx} />
            )),
          )
        )}
        {!raw && (
          <>
            {usage.length === 0 && (
              <section className="wb-inspector-panel" aria-label="JSX">
                <InspectorCode code={componentCode(component, defaultValues(component.props))} />
              </section>
            )}
            <nav className="wb-inspector-panel wb-scene-usage" aria-label="Consuming scenes">
              <header className="wb-inspector-panel-heading">
                <h2>Consuming scenes</h2>
              </header>
              {scenes.length > 0 ? (
                <ul>
                  {scenes.map(({ id, title }) => (
                    <li key={id}>
                      <a href={itemHref(id)} onClick={(event) => navigate(event, id)}>
                        {title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="wb-inspector-note">No linked scenes.</p>
              )}
            </nav>
          </>
        )}
      </div>
    );
  }

  const preview = renderArtboards((theme) =>
    renderPreview(
      theme,
      'playground',
      undefined,
      (ctx) => (
        <PlaygroundForm
          kind={component.form}
          showCommands={!raw}
          onSubmit={(entries) => {
            setSubmissions((current) => [
              ...current.filter((data) => data.theme.id !== theme.id),
              { theme, entries },
            ]);
            report(theme, 'submit');
          }}
          onReset={() => report(theme, 'reset')}
        >
          <Component values={playground.values} ctx={ctx} />
        </PlaygroundForm>
      ),
      surface,
      (name) => (value) => report(theme, name, value),
    ),
  );
  if (raw) {
    return <div className="wb-inspector wb-playground-capture">{preview}</div>;
  }

  const propDefinitions = Object.values(component.props);
  const hasForm = component.form !== undefined;
  const showEvents = hasForm || propDefinitions.some((prop) => prop.kind === 'action');
  return (
    <div className="wb-inspector wb-inspector-playground">
      <div
        className="wb-playground-preview wb-scroll"
        role="region"
        aria-label="Preview"
        tabIndex={0}
      >
        {preview}
      </div>
      <PlaygroundPanels
        code={<InspectorCode code={componentCode(component, playground.values)} />}
        controls={
          propDefinitions.length > 0 && (
            <PlaygroundControls
              component={component}
              draft={playground.draft}
              numberDrafts={playground.numberDrafts}
              matches={evaluate(component.constraints, playground.draft).matches}
              onValue={updateValue}
              onNumber={updateNumber}
              onReset={() => setPlayground(initialState(component))}
            />
          )
        }
        events={showEvents && <EventsPanel events={events} onClear={() => setEvents(emptyLog)} />}
        formData={hasForm && <FormDataPanel submissions={submissions} />}
      />
    </div>
  );
}
