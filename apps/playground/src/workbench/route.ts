import { componentCompositions, componentStates } from './schema.js';
import type {
  InspectorTab,
  StatesMode,
  SurfaceMode,
  TextDirection,
  TextScale,
  ViewportSize,
  WorkbenchConfig,
  WorkbenchTabDefinition,
  WorkbenchTheme,
} from './types.js';

export const DEFAULT_COMPONENT_TABS: readonly WorkbenchTabDefinition[] = [
  { id: 'playground', label: 'Playground', kind: 'playground' },
  { id: 'states', label: 'States', kind: 'states', aliases: ['matrix', 'cases'] },
  { id: 'compositions', label: 'Compositions', kind: 'compositions' },
  { id: 'usage', label: 'Usage', kind: 'usage' },
];

export const tabs = ['playground', 'states', 'compositions', 'usage'] as const;
export const schemes = ['dark', 'light', 'both'] as const;
export const viewports = ['auto', 360, 768, 1280, 1440] as const;
export const surfaces = ['auto', 'base', 'overlay'] as const;

export function resolveComponentTabs(config: WorkbenchConfig): readonly WorkbenchTabDefinition[] {
  return config.componentTabs?.length ? config.componentTabs : DEFAULT_COMPONENT_TABS;
}

export function findComponentTab(
  config: WorkbenchConfig,
  idOrAlias: string | null | undefined,
): WorkbenchTabDefinition | undefined {
  if (!idOrAlias) {
    return undefined;
  }
  const available = resolveComponentTabs(config);
  return (
    available.find((tab) => tab.id === idOrAlias) ??
    available.find((tab) => tab.aliases?.includes(idOrAlias))
  );
}

export interface WorkbenchRoute {
  readonly item: string;
  readonly tab: InspectorTab;
  readonly family: string;
  readonly scheme: (typeof schemes)[number];
  readonly solo?: string | undefined;
  readonly slice?: string | undefined;
  readonly mode: StatesMode;
  readonly block?: string | undefined;
  readonly surface: SurfaceMode;
  readonly vp: ViewportSize;
  readonly scale: TextScale;
  readonly dir: TextDirection;
  readonly bounds: boolean;
  readonly raw: boolean;
  readonly freeze: boolean;
}

export function selectThemes(
  themes: readonly WorkbenchTheme[],
  family: WorkbenchRoute['family'],
  scheme: WorkbenchRoute['scheme'],
): WorkbenchTheme[] {
  return themes.filter(
    (theme) =>
      (family === 'all' || theme.family === family) &&
      (scheme === 'both' || theme.colorScheme === scheme),
  );
}

export function selectRouteThemes(
  themes: readonly WorkbenchTheme[],
  route: Pick<WorkbenchRoute, 'family' | 'scheme' | 'solo'>,
): WorkbenchTheme[] {
  if (route.solo) {
    const match = themes.find((theme) => theme.id === route.solo);
    if (match) {
      return [match];
    }
  }
  return selectThemes(themes, route.family, route.scheme);
}

function parseStatesMode(modeParam: string | null): StatesMode {
  if (modeParam === 'pairwise' || modeParam === 'full' || modeParam === 'slice') {
    return modeParam;
  }
  if (modeParam === 'combinator') {
    return 'slice';
  }
  return 'overview';
}

export function readRoute(search: string, config: WorkbenchConfig): WorkbenchRoute {
  const params = new URLSearchParams(search);
  const item = params.get('item') ?? config.components[0]?.id ?? config.scenes[0]?.id ?? '';
  const component = config.components.find((entry) => entry.id === item);
  const scene = config.scenes.find((entry) => entry.id === item);

  const soloParam = params.get('solo');
  const solo =
    soloParam !== null && config.themes.some((theme) => theme.id === soloParam)
      ? soloParam
      : undefined;

  const familyParam = params.get('family');
  const family =
    !solo && familyParam !== null && config.themes.some((theme) => theme.family === familyParam)
      ? familyParam
      : 'all';
  const schemeParam = params.get('scheme');
  const scheme =
    !solo &&
    (schemeParam === 'dark' || schemeParam === 'light') &&
    selectThemes(config.themes, family, schemeParam).length
      ? schemeParam
      : 'both';

  const componentTabs = resolveComponentTabs(config);
  const defaultTab = componentTabs[0]!;
  const statesTab = componentTabs.find((entry) => entry.kind === 'states');
  const compositionsTab = componentTabs.find((entry) => entry.kind === 'compositions');

  const rawTabParam = params.get('tab');
  const modeParam = params.get('mode');
  const requestedMode = parseStatesMode(modeParam);
  const explicitTab = findComponentTab(config, rawTabParam);

  let resolvedTab: WorkbenchTabDefinition = defaultTab;
  if (component) {
    if (explicitTab) {
      resolvedTab = explicitTab;
    } else if (requestedMode !== 'overview' && statesTab) {
      resolvedTab = statesTab;
    } else if (params.get('slice') && statesTab) {
      const slices = componentStates(component);
      if (slices.some((entry) => entry.id === params.get('slice'))) {
        resolvedTab = statesTab;
      }
    }
  }

  // Backward-compatibility redirect: legacy v2 bookmarks targeting `?tab=usage&block=<compositionId>`.
  const blockParam = params.get('block');
  if (
    component &&
    resolvedTab.kind === 'usage' &&
    blockParam &&
    compositionsTab &&
    componentCompositions(component).some((entry) => entry.id === blockParam)
  ) {
    resolvedTab = compositionsTab;
  }

  const slices = component ? componentStates(component) : [];
  const compositions = component ? componentCompositions(component) : [];

  const availableBlocks =
    resolvedTab.kind === 'states'
      ? component?.cases
      : resolvedTab.kind === 'compositions'
        ? compositions
        : undefined;
  const block = availableBlocks?.find((entry) => entry.id === blockParam)?.id;
  const slice =
    resolvedTab.kind === 'states'
      ? slices.find((entry) => entry.id === params.get('slice'))?.id
      : undefined;

  // Legacy `?tab=matrix` without an explicit mode or slice still opens the interactive Combinator
  // when there are slices/props; with an explicit `slice`, overview or slice both honor `slice`.
  let mode: StatesMode = 'overview';
  if (resolvedTab.kind === 'states') {
    if (requestedMode !== 'overview') {
      mode = requestedMode;
    } else if (rawTabParam === 'matrix' && modeParam !== 'overview' && !block) {
      mode = 'slice';
    }
  }

  return {
    item,
    tab: component ? resolvedTab.id : defaultTab.id,
    family,
    scheme,
    solo,
    slice,
    mode,
    block: slice || (resolvedTab.kind === 'states' && mode !== 'overview') ? undefined : block,
    surface: surfaces.find((surface) => surface === params.get('surface')) ?? 'auto',
    vp: viewports.find((vp) => String(vp) === params.get('vp')) ?? scene?.defaultViewport ?? 'auto',
    scale: params.get('scale') === '120' ? 120 : 100,
    dir: params.get('dir') === 'rtl' ? 'rtl' : 'ltr',
    bounds: Boolean(component && params.get('bounds') === '1'),
    raw: params.get('raw') === '1',
    freeze: params.get('freeze') === '1',
  };
}

export function routeSearch(route: WorkbenchRoute, config: WorkbenchConfig): string {
  const params = new URLSearchParams();
  const componentTabs = resolveComponentTabs(config);
  const defaultTabId = componentTabs[0]!.id;
  const activeTab = findComponentTab(config, route.tab);
  const defaultViewport =
    config.scenes.find((scene) => scene.id === route.item)?.defaultViewport ?? 'auto';
  if (route.item || config.components.length || config.scenes.length) {
    params.set('item', route.item);
  }
  if (route.tab !== defaultTabId) {
    params.set('tab', route.tab);
  }
  const validSolo =
    route.solo && config.themes.some((theme) => theme.id === route.solo) ? route.solo : undefined;
  if (validSolo) {
    params.set('solo', validSolo);
  } else {
    if (route.family !== 'all') {
      params.set('family', route.family);
    }
    if (route.scheme !== 'both') {
      params.set('scheme', route.scheme);
    }
  }
  if (activeTab?.kind === 'states' && route.slice) {
    params.set('slice', route.slice);
  }
  if (activeTab?.kind === 'states' && route.mode !== 'overview') {
    params.set('mode', route.mode);
  }
  if ((activeTab?.kind === 'states' || activeTab?.kind === 'compositions') && route.block) {
    params.set('block', route.block);
  }
  if (route.surface !== 'auto') {
    params.set('surface', route.surface);
  }
  if (route.vp !== defaultViewport) {
    params.set('vp', String(route.vp));
  }
  if (route.scale !== 100) {
    params.set('scale', String(route.scale));
  }
  if (route.dir !== 'ltr') {
    params.set('dir', route.dir);
  }
  if (route.bounds) {
    params.set('bounds', '1');
  }
  if (route.raw) {
    params.set('raw', '1');
  }
  if (route.freeze) {
    params.set('freeze', '1');
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function patchRoute(
  current: WorkbenchRoute,
  patch: Partial<WorkbenchRoute>,
  config: WorkbenchConfig,
): WorkbenchRoute {
  const componentTabs = resolveComponentTabs(config);
  const defaultTabId = componentTabs[0]!.id;
  const statesTab = componentTabs.find((entry) => entry.kind === 'states');
  const compositionsTab = componentTabs.find((entry) => entry.kind === 'compositions');
  const targetItem = patch.item ?? current.item;
  const targetComponent = config.components.find((entry) => entry.id === targetItem);

  let effectiveTab = patch.tab;
  if (
    effectiveTab === undefined &&
    statesTab &&
    (patch.slice !== undefined || (patch.mode !== undefined && patch.mode !== 'overview'))
  ) {
    effectiveTab = statesTab.id;
  } else if (effectiveTab === 'matrix' && patch.mode === 'overview' && statesTab) {
    effectiveTab = statesTab.id;
  } else if (
    effectiveTab !== undefined &&
    findComponentTab(config, effectiveTab)?.kind === 'usage' &&
    patch.block &&
    compositionsTab &&
    targetComponent &&
    componentCompositions(targetComponent).some((entry) => entry.id === patch.block)
  ) {
    effectiveTab = compositionsTab.id;
  }

  const clearsSolo =
    patch.solo === undefined &&
    (patch.family !== undefined ||
      patch.scheme !== undefined ||
      (patch.item !== undefined && patch.item !== current.item) ||
      (effectiveTab !== undefined && effectiveTab !== current.tab));
  const normalizedPatch: Partial<WorkbenchRoute> = {
    ...patch,
    ...(effectiveTab !== undefined ? { tab: effectiveTab } : {}),
    ...(clearsSolo ? { solo: undefined } : {}),
  };

  const next =
    normalizedPatch.item !== undefined && normalizedPatch.item !== current.item
      ? {
          ...current,
          tab: defaultTabId,
          solo: undefined,
          mode: 'overview' as const,
          block: undefined,
          slice: undefined,
          surface: 'auto' as const,
          vp:
            config.scenes.find((scene) => scene.id === normalizedPatch.item)?.defaultViewport ??
            'auto',
          ...normalizedPatch,
        }
      : {
          ...current,
          ...(normalizedPatch.tab && normalizedPatch.tab !== current.tab
            ? { solo: undefined, block: undefined, slice: undefined, mode: 'overview' as const }
            : {}),
          ...(normalizedPatch.block !== undefined ? { slice: undefined } : {}),
          ...(normalizedPatch.slice !== undefined ? { block: undefined } : {}),
          ...normalizedPatch,
        };
  return readRoute(routeSearch(next, config), config);
}
