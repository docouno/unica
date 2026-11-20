import { createContext, useContext, useMemo } from 'react';
import type { JSX, ReactNode } from 'react';
import type { ThemePreset } from './themes.js';

interface ComponentDefaultAxes {
  readonly Icon: {
    readonly size: 'inherit' | 's' | 'm' | 'l';
  };
}

export type UnicaComponentDefaults = {
  readonly [Family in keyof ComponentDefaultAxes]?:
    | {
        readonly [Axis in keyof ComponentDefaultAxes[Family]]?:
          ComponentDefaultAxes[Family][Axis] | undefined;
      }
    | undefined;
};

export interface ThemeConfig {
  readonly preset: ThemePreset;
  readonly defaults?: UnicaComponentDefaults | undefined;
}

export interface UnicaProviderProps {
  readonly children: ReactNode;
  readonly theme?: ThemeConfig | undefined;
  readonly overrides?: UnicaComponentDefaults | undefined;
}

interface OverrideScope {
  readonly defaults: UnicaComponentDefaults;
  readonly parent: OverrideScope | undefined;
}

interface UnicaScope {
  readonly theme: ThemeConfig;
  readonly overrides: OverrideScope | undefined;
}

const UnicaContext = /* @__PURE__ */ createContext<UnicaScope>({
  theme: { preset: 'soft-dark' },
  overrides: undefined,
});

export function UnicaProvider({ children, theme, overrides }: UnicaProviderProps): JSX.Element {
  const parent = useContext(UnicaContext);
  const scope = useMemo<UnicaScope>(() => {
    if (theme === undefined && overrides === undefined) {
      return parent;
    }

    return {
      theme: theme ?? parent.theme,
      overrides:
        overrides === undefined
          ? parent.overrides
          : { defaults: overrides, parent: parent.overrides },
    };
  }, [parent, theme, overrides]);

  return <UnicaContext value={scope}>{children}</UnicaContext>;
}

interface DefaultInputs<Value> {
  readonly instance?: Value | undefined;
  readonly group?: Value | undefined;
  readonly builtIn: Value;
}

export function useComponentDefaults<
  Family extends keyof ComponentDefaultAxes,
  Axis extends keyof ComponentDefaultAxes[Family],
>(
  family: Family,
  axis: Axis,
  { instance, group, builtIn }: DefaultInputs<ComponentDefaultAxes[Family][Axis]>,
): ComponentDefaultAxes[Family][Axis] {
  const { theme, overrides } = useContext(UnicaContext);
  if (instance !== undefined) {
    return instance;
  }
  if (group !== undefined) {
    return group;
  }

  for (let scope = overrides; scope !== undefined; scope = scope.parent) {
    const value = scope.defaults[family]?.[axis];
    if (value !== undefined) {
      return value;
    }
  }

  const themeValue = theme.defaults?.[family]?.[axis];
  return themeValue === undefined ? builtIn : themeValue;
}
