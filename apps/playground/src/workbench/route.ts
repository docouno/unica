import type {
  InspectorTab,
  MatrixMode,
  SurfaceMode,
  TextDirection,
  TextScale,
  ViewportSize,
  WorkbenchConfig,
  WorkbenchTheme,
} from './types.js';

export const tabs = ['playground', 'matrix', 'cases', 'usage'] as const;
export const schemes = ['dark', 'light', 'both'] as const;
export const viewports = ['auto', 360, 768, 1280, 1440] as const;
export const surfaces = ['auto', 'base', 'overlay'] as const;

export interface WorkbenchRoute {
  readonly item: string;
  readonly tab: InspectorTab;
  readonly family: string;
  readonly scheme: (typeof schemes)[number];
  readonly slice?: string | undefined;
  readonly mode: MatrixMode;
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

export function readRoute(search: string, config: WorkbenchConfig): WorkbenchRoute {
  const params = new URLSearchParams(search);
  const item = params.get('item') ?? config.components[0]?.id ?? config.scenes[0]?.id ?? '';
  const component = config.components.find((entry) => entry.id === item);
  const scene = config.scenes.find((entry) => entry.id === item);

  const familyParam = params.get('family');
  const family =
    familyParam !== null && config.themes.some((theme) => theme.family === familyParam)
      ? familyParam
      : 'all';
  const schemeParam = params.get('scheme');
  const scheme =
    (schemeParam === 'dark' || schemeParam === 'light') &&
    selectThemes(config.themes, family, schemeParam).length
      ? schemeParam
      : 'both';

  const modeParam = params.get('mode');
  const requestedMode = modeParam === 'pairwise' || modeParam === 'full' ? modeParam : 'slice';
  const requestedTab = tabs.find((tab) => tab === params.get('tab'));
  const tab = component
    ? (requestedTab ?? (requestedMode === 'slice' ? 'playground' : 'matrix'))
    : 'playground';

  const availableBlocks =
    tab === 'cases' ? component?.cases : tab === 'usage' ? component?.usage : undefined;
  const block = availableBlocks?.find((entry) => entry.id === params.get('block'))?.id;
  const slice =
    tab === 'matrix'
      ? component?.matrixViews?.find((entry) => entry.id === params.get('slice'))?.id
      : undefined;

  return {
    item,
    tab,
    family,
    scheme,
    slice,
    mode: tab === 'matrix' ? requestedMode : 'slice',
    block,
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
  const defaultViewport =
    config.scenes.find((scene) => scene.id === route.item)?.defaultViewport ?? 'auto';
  if (route.item || config.components.length || config.scenes.length) {
    params.set('item', route.item);
  }
  if (route.tab !== 'playground') {
    params.set('tab', route.tab);
  }
  if (route.family !== 'all') {
    params.set('family', route.family);
  }
  if (route.scheme !== 'both') {
    params.set('scheme', route.scheme);
  }
  if (route.tab === 'matrix' && route.slice) {
    params.set('slice', route.slice);
  }
  if (route.tab === 'matrix' && route.mode !== 'slice') {
    params.set('mode', route.mode);
  }
  if ((route.tab === 'cases' || route.tab === 'usage') && route.block) {
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
  const next =
    patch.item !== undefined && patch.item !== current.item
      ? {
          ...current,
          tab: 'playground' as const,
          mode: 'slice' as const,
          block: undefined,
          slice: undefined,
          surface: 'auto' as const,
          vp: config.scenes.find((scene) => scene.id === patch.item)?.defaultViewport ?? 'auto',
          ...patch,
        }
      : {
          ...current,
          ...(patch.tab && patch.tab !== current.tab ? { block: undefined } : {}),
          ...patch,
        };
  return readRoute(routeSearch(next, config), config);
}
