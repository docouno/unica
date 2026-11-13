import type { ReactNode } from 'react';

export type ViewportSize = 'auto' | 360 | 768 | 1280 | 1440;
export type TextScale = 100 | 120;
export type TextDirection = 'ltr' | 'rtl';

export interface WorkbenchTheme {
  readonly id: string;
  readonly label: string;
  readonly family: string;
  readonly colorScheme: 'dark' | 'light';
  readonly meta?: string;
}

export interface SpecimenSection {
  readonly id: string;
  readonly title: string;
  readonly kind: 'matrix' | 'states' | 'context';
  readonly caption?: string;
  readonly surface?: 'base' | 'overlay';
  readonly overlayStage?: boolean;
  readonly render: () => ReactNode;
}

export interface SpecimenDefinition {
  readonly id: string;
  readonly title: string;
  readonly group: string;
  readonly summary?: string;
  readonly defaultSurface?: 'base' | 'overlay';
  readonly sections: readonly SpecimenSection[];
}

export interface SceneDefinition {
  readonly id: string;
  readonly title: string;
  readonly group: string;
  readonly summary?: string;
  readonly defaultViewport?: ViewportSize;
  readonly surface?: 'base' | 'overlay';
  readonly overlayStage?: boolean;
  readonly render: () => ReactNode;
}

export interface WorkbenchStageContext {
  readonly theme: WorkbenchTheme;
  readonly surface: 'base' | 'overlay';
  readonly overlayStage: boolean;
  readonly children: ReactNode;
}

export interface WorkbenchEmptyContext {
  readonly theme: WorkbenchTheme;
  readonly surface: 'base' | 'overlay';
}

export interface WorkbenchConfig {
  readonly title: string;
  readonly subtitle: string;
  readonly themes: readonly WorkbenchTheme[];
  readonly defaultThemeId: string;
  readonly specimens: readonly SpecimenDefinition[];
  readonly scenes: readonly SceneDefinition[];
  readonly renderStage?: (ctx: WorkbenchStageContext) => ReactNode;
  readonly renderEmptyState?: (ctx: WorkbenchEmptyContext) => ReactNode;
}

export function defineSpecimen(definition: SpecimenDefinition): SpecimenDefinition {
  return definition;
}

export function defineScene(definition: SceneDefinition): SceneDefinition {
  return definition;
}
