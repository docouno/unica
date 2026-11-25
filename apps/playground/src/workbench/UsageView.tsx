import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent, ReactElement } from 'react';
import { InspectorCode } from './InspectorCode.js';
import { MarkdownView } from './MarkdownView.js';
import type { ResolvedMarkdownLink } from './MarkdownView.js';
import { extractMarkdownHeadings } from './markdownParser.js';
import { ViewSettings } from './ViewSettings.js';
import { componentCode, defaultValues } from './schema.js';
import type {
  ComponentDefinition,
  Constraint,
  InspectorTab,
  PropDefinition,
  SceneDefinition,
  StatesMode,
  WorkbenchDocsConfig,
} from './types.js';
import './toc.css';
import './usage.css';

export interface RouteDestination {
  readonly item: string;
  readonly tab?: InspectorTab | undefined;
  readonly slice?: string | undefined;
  readonly block?: string | undefined;
  readonly mode?: StatesMode | undefined;
}

export interface UsageViewProps {
  readonly component: ComponentDefinition;
  readonly scenes: readonly SceneDefinition[];
  readonly docsConfig?: WorkbenchDocsConfig | undefined;
  readonly raw: boolean;
  readonly itemHref: (destination: RouteDestination) => string;
  readonly navigateItem: (destination: RouteDestination) => void;
}

const IDENTIFIER_PATTERN = /^[A-Z][A-Za-z0-9_$]*$/;

function stripQuotedStrings(source: string): string {
  return source.replace(/(["'`])(?:\\.|(?!\1)[^\\\r\n])*\1/g, '""');
}

function extractAlreadyImportedNames(source: string): Set<string> {
  const imported = new Set<string>();
  for (const match of source.matchAll(
    /import\s+(?:type\s+)?(?:[A-Za-z_$][A-Za-z0-9_$]*\s*,\s*)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g,
  )) {
    for (const part of match[1]!.split(',')) {
      const aliasParts = part
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/);
      const localName = aliasParts[aliasParts.length - 1]?.trim();
      if (localName) {
        imported.add(localName);
      }
    }
  }
  for (const match of source.matchAll(
    /import\s+(?:type\s+)?([A-Z][A-Za-z0-9_$]*)(?:\s*,|\s+from\b)/g,
  )) {
    if (match[1]) {
      imported.add(match[1]);
    }
  }
  return imported;
}

function extractJsxTags(jsx: string): string[] {
  const sanitized = stripQuotedStrings(jsx);
  const names = new Set<string>();
  for (const match of sanitized.matchAll(
    /(?:^|[^A-Za-z0-9_$])<([A-Z][A-Za-z0-9_$]*)(?=[\s/>.])/g,
  )) {
    if (match[1]) {
      names.add(match[1]);
    }
  }
  return [...names];
}

function resolveImportNames(
  component: ComponentDefinition,
  quickStartJsx: string,
  explicit: readonly string[] | undefined,
  exportedNames: ReadonlySet<string> | undefined,
  importFrom: string | undefined,
): readonly string[] {
  if (explicit?.length) {
    return explicit;
  }
  if (!importFrom) {
    return [];
  }
  // If the authored snippet already imports from the same package, don't prepend another import.
  const escapedPkg = importFrom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`import\\b[^\\n]*['"]${escapedPkg}['"]`).test(quickStartJsx)) {
    return [];
  }

  const alreadyImported = extractAlreadyImportedNames(quickStartJsx);
  const allow = (name: string): boolean =>
    IDENTIFIER_PATTERN.test(name) &&
    !alreadyImported.has(name) &&
    (exportedNames === undefined || exportedNames.has(name));

  const tags = extractJsxTags(quickStartJsx).filter(allow);
  if (tags.length > 0) {
    return tags;
  }
  if (component.componentName && allow(component.componentName)) {
    return [component.componentName];
  }
  if (allow(component.title)) {
    return [component.title];
  }
  return [];
}

function formatPropType(prop: PropDefinition): string {
  switch (prop.kind) {
    case 'enum': {
      const publicChoices = prop.choices.filter((choice) => !choice.omit);
      return publicChoices.map((choice) => JSON.stringify(choice.value)).join(' | ') || 'undefined';
    }
    case 'slot': {
      const snippets = prop.choices
        .map((choice) => choice.code?.trim())
        .filter((code): code is string => Boolean(code));
      return snippets.length > 0 ? `ReactNode (e.g. ${snippets.join(' | ')})` : 'ReactNode';
    }
    case 'boolean':
      return 'boolean';
    case 'number':
      return prop.examples?.length ? `number (${prop.examples.join(', ')})` : 'number';
    case 'string':
      return prop.examples?.length
        ? `string (${prop.examples.map((v) => JSON.stringify(v)).join(', ')})`
        : 'string';
    case 'action':
      return 'callback';
  }
}

function formatPropDefault(prop: PropDefinition): string {
  if (prop.kind === 'action') {
    return prop.code;
  }
  if (prop.kind === 'enum') {
    const chosen = prop.choices.find((choice) => choice.value === prop.default);
    if (chosen?.omit) {
      return 'undefined';
    }
    return JSON.stringify(prop.default);
  }
  if (prop.kind === 'slot') {
    const chosen = prop.choices.find((choice) => choice.value === prop.default);
    if (chosen?.code) {
      return chosen.code;
    }
    if (prop.default === '' || prop.default === 'none' || prop.default === 'empty') {
      return 'undefined';
    }
    return chosen?.label ?? prop.default;
  }
  if (typeof prop.default === 'string') {
    return prop.default === '' ? '""' : JSON.stringify(prop.default);
  }
  return String(prop.default);
}

function formatConstraintWhen(rule: Constraint): string {
  return Object.entries(rule.when)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(', ');
}

function formatConstraintAffects(rule: Constraint): string {
  return rule.affects
    .map((target) =>
      typeof target === 'string' ? target : `${target.key}=${JSON.stringify(target.value)}`,
    )
    .join(', ');
}

const constraintKindLabels: Record<Constraint['kind'], string> = {
  forbidden: 'Forbidden',
  ignored: 'Ignored',
  precedence: 'Precedence',
};

function scrollToSection(id: string, trigger: HTMLElement | null): void {
  trigger?.closest<HTMLDialogElement>('dialog[open]')?.close();
  const target = document.getElementById(id);
  if (!target) {
    return;
  }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

function PropsTable({
  label,
  entries,
}: {
  readonly label: string;
  readonly entries: readonly (readonly [string, PropDefinition])[];
}): ReactElement {
  return (
    <div className="wb-md-table-wrap wb-scroll" role="region" aria-label={label} tabIndex={0}>
      <table className="wb-md-table wb-props-table" aria-label={label}>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type / values</th>
            <th scope="col">Playground default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, prop]) => (
            <tr key={key}>
              <td>
                <div className="wb-prop-name">
                  <code className="wb-md-inline-code">{key}</code>
                  <span className="wb-prop-group">{prop.group}</span>
                </div>
              </td>
              <td>
                <code className="wb-prop-type">
                  {prop.publicType?.trim() || formatPropType(prop)}
                </code>
              </td>
              <td>
                <code className="wb-md-inline-code">{formatPropDefault(prop)}</code>
              </td>
              <td>{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsageView({
  component,
  scenes,
  docsConfig,
  raw,
  itemHref,
  navigateItem,
}: UsageViewProps): ReactElement {
  const source = useMemo(() => docsConfig?.resolve?.(component), [component, docsConfig]);
  const markdownSource = source?.markdown;
  const syncMarkdown = typeof markdownSource === 'string' ? markdownSource : undefined;

  const [loaded, setLoaded] = useState<{
    readonly loader: () => Promise<string>;
    readonly markdown: string;
  }>();

  useEffect(() => {
    if (typeof markdownSource !== 'function') {
      return;
    }
    let active = true;
    markdownSource().then(
      (markdown) => {
        if (active) {
          setLoaded({ loader: markdownSource, markdown });
        }
      },
      () => {
        if (active) {
          setLoaded({ loader: markdownSource, markdown: '' });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [markdownSource]);

  const loadingMarkdown = typeof markdownSource === 'function' && loaded?.loader !== markdownSource;
  const markdown =
    syncMarkdown ?? (loaded && loaded.loader === markdownSource ? loaded.markdown : undefined);

  const defaults = useMemo(() => defaultValues(component.props), [component.props]);
  const quickStartJsx = useMemo(
    () => source?.quickStartCode ?? componentCode(component, defaults),
    [component, defaults, source?.quickStartCode],
  );

  const importFrom =
    source?.importFrom ?? (component.status === 'UI' ? docsConfig?.defaultImportFrom : undefined);
  const importNames = resolveImportNames(
    component,
    quickStartJsx,
    source?.imports,
    docsConfig?.exportedNames,
    importFrom,
  );
  const quickStartCode =
    importFrom && importNames.length > 0
      ? `import { ${importNames.join(', ')} } from '${importFrom}';\n\n${quickStartJsx}`
      : quickStartJsx;

  const propEntries = Object.entries(component.props);
  const publicProps = propEntries.filter(([, prop]) => !prop.demo);
  const demoProps = propEntries.filter(([, prop]) => prop.demo);
  const constraints = component.constraints ?? [];
  const docHeadings = useMemo(
    () => (markdown ? extractMarkdownHeadings(markdown) : []),
    [markdown],
  );

  const resolveLink = useMemo(
    () =>
      (href: string): ResolvedMarkdownLink | null => {
        if (href.startsWith('/?')) {
          const [queryPart] = href.slice(2).split('#');
          const params = new URLSearchParams(queryPart ?? '');
          const targetItem = params.get('item');
          if (targetItem) {
            const rawMode = params.get('mode');
            const parsedMode: StatesMode | undefined =
              rawMode === 'overview' ||
              rawMode === 'slice' ||
              rawMode === 'pairwise' ||
              rawMode === 'full'
                ? rawMode
                : rawMode === 'combinator'
                  ? 'slice'
                  : undefined;
            const destination: RouteDestination = {
              item: targetItem,
              tab: params.get('tab') ?? undefined,
              slice: params.get('slice') ?? undefined,
              block: params.get('block') ?? undefined,
              mode: parsedMode,
            };
            return {
              href: itemHref(destination),
              onNavigate: () => navigateItem(destination),
            };
          }
        }
        const resolved = docsConfig?.resolveDocLink?.(href, component);
        if (resolved) {
          return {
            href: itemHref(resolved),
            onNavigate: () => navigateItem(resolved),
          };
        }
        return null;
      },
    [component, docsConfig, itemHref, navigateItem],
  );

  const navigateScene = (event: MouseEvent<HTMLAnchorElement>, id: string): void => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigateItem({ item: id });
  };

  return (
    <div className="wb-inspector wb-usage-view">
      {!raw && (
        <ViewSettings>
          <nav className="wb-toc" aria-label="On this page">
            <h2 className="wb-toc-heading">On this page</h2>
            <ul className="wb-toc-list">
              <li>
                <button
                  type="button"
                  className="wb-toc-link"
                  onClick={(event) => scrollToSection('wb-usage-quick-start', event.currentTarget)}
                >
                  Quick start
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="wb-toc-link"
                  onClick={(event) => scrollToSection('wb-usage-props', event.currentTarget)}
                >
                  Props &amp; constraints
                </button>
              </li>
              {docHeadings.map((heading) => (
                <li key={heading.id}>
                  <button
                    type="button"
                    className="wb-toc-link"
                    onClick={(event) => scrollToSection(heading.id, event.currentTarget)}
                  >
                    {heading.text}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="wb-toc-link"
                  onClick={(event) => scrollToSection('wb-usage-scenes', event.currentTarget)}
                >
                  Consuming scenes
                </button>
              </li>
            </ul>
          </nav>
        </ViewSettings>
      )}

      {(component.summary || source?.sourceLabel) && (
        <header className="wb-usage-intro">
          {component.summary && <p className="wb-usage-summary">{component.summary}</p>}
          {source?.sourceLabel && (
            <p className="wb-inspector-note wb-usage-provenance">
              Source: <code>{source.sourceLabel}</code>
            </p>
          )}
        </header>
      )}

      <section
        id="wb-usage-quick-start"
        className="wb-usage-section"
        aria-labelledby="wb-usage-quick-start-heading"
      >
        <h2 id="wb-usage-quick-start-heading">Quick start</h2>
        {!importFrom && component.status === 'Proto' && (
          <p className="wb-inspector-note">
            Design prototype — not yet exported as a production package API.
          </p>
        )}
        <InspectorCode
          code={quickStartCode}
          language="tsx"
          format
          copyable={!raw}
          standalone
          label={importFrom ? 'tsx' : 'jsx'}
          copyName="Copy quick start snippet"
        />
      </section>

      <section
        id="wb-usage-props"
        className="wb-usage-section"
        aria-labelledby="wb-usage-props-heading"
      >
        <h2 id="wb-usage-props-heading">Props &amp; constraints</h2>
        {publicProps.length > 0 ? (
          <PropsTable label="Public props" entries={publicProps} />
        ) : (
          <p className="wb-inspector-note">No configurable public props declared.</p>
        )}
        {demoProps.length > 0 && (
          <details className="wb-usage-demo-props">
            <summary className="wb-disclosure">
              Playground-only settings ({demoProps.length})
            </summary>
            <PropsTable label="Playground-only settings" entries={demoProps} />
          </details>
        )}
        {constraints.length > 0 && (
          <div className="wb-usage-constraints">
            <h3>Constraints</h3>
            <ul className="wb-constraint-list">
              {constraints.map((rule, index) => (
                <li key={index} className="wb-constraint-item">
                  <span className="wb-constraint-kind" data-rule={rule.kind}>
                    {constraintKindLabels[rule.kind]}
                  </span>
                  <span className="wb-constraint-detail">
                    <code>{formatConstraintWhen(rule)}</code>
                    {' → '}
                    <code>{formatConstraintAffects(rule)}</code>: {rule.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {loadingMarkdown && (
        <section className="wb-usage-section" data-wb-pending="">
          <p className="wb-inspector-note">Loading documentation…</p>
        </section>
      )}

      {markdown && markdown.trim().length > 0 && (
        <section
          id="wb-usage-reference"
          className="wb-usage-section wb-usage-docs"
          aria-label="Reference documentation"
        >
          <MarkdownView markdown={markdown} raw={raw} resolveLink={resolveLink} />
        </section>
      )}

      <nav
        id="wb-usage-scenes"
        className="wb-inspector-panel wb-scene-usage"
        aria-label="Consuming scenes"
      >
        <header className="wb-inspector-panel-heading">
          <h2>Consuming scenes</h2>
        </header>
        {scenes.length > 0 ? (
          <ul>
            {scenes.map(({ id, title }) => (
              <li key={id}>
                <a href={itemHref({ item: id })} onClick={(event) => navigateScene(event, id)}>
                  {title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="wb-inspector-note">No linked scenes.</p>
        )}
      </nav>
    </div>
  );
}
