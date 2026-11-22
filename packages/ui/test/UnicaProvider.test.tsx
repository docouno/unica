import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { memo, Profiler, useEffect } from 'react';
import type { JSX } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import {
  getUnicaRootProps,
  Icon,
  Link,
  UnicaProvider,
  usePortalContainer,
  defineGlyph,
  type IconSize,
  type LinkSize,
  type ThemeConfig,
  type ThemePreset,
  type UnicaComponentDefaults,
  type UnicaRootAttributes,
} from '../src/index.js';
import { getUnicaRootProps as serverGetUnicaRootProps } from '../src/server.js';
import type {
  LinkSize as ServerLinkSize,
  UnicaRootAttributes as ServerRootAttributes,
} from '../src/server.js';
import { IconSizeProbe } from './fixtures/icon-size-probe.js';

afterEach(cleanup);

it.each([
  ['instance', 'inherit', 'l', 's', 'm', 'inherit'],
  ['group', undefined, 'l', 's', 'm', 'l'],
  ['provider override', undefined, undefined, 's', 'm', 's'],
  ['active theme default', undefined, undefined, undefined, 'm', 'm'],
  ['built-in default', undefined, undefined, undefined, undefined, 'inherit'],
] as const)(
  'resolves size from the %s',
  (_source, size, groupSize, override, themeSize, result) => {
    render(
      <UnicaProvider
        theme={{ preset: 'frost-dark', defaults: { Icon: { size: themeSize } } }}
        overrides={{ Icon: { size: override } }}
      >
        <IconSizeProbe label="Control" size={size} groupSize={groupSize} />
      </UnicaProvider>,
    );

    expect(screen.getByRole('button').getAttribute('data-size')).toBe(result);
  },
);

it('inherits overrides by axis while replacing the theme config as a whole', () => {
  const outerTheme: ThemeConfig = {
    preset: 'soft-light',
    defaults: { Icon: { size: 'm' } },
  };

  function Scopes({
    innerTheme,
    outerOverride,
  }: {
    readonly innerTheme?: ThemeConfig;
    readonly outerOverride?: UnicaComponentDefaults;
  }): JSX.Element {
    return (
      <>
        <UnicaProvider theme={outerTheme} overrides={outerOverride}>
          <UnicaProvider theme={innerTheme}>
            <IconSizeProbe label="Inner without override" />
            <UnicaProvider overrides={{ Icon: { size: undefined } }}>
              <IconSizeProbe label="Inner with missing axis" />
            </UnicaProvider>
            <UnicaProvider overrides={{ Icon: { size: 'l' } }}>
              <IconSizeProbe label="Inner with override" />
            </UnicaProvider>
          </UnicaProvider>
          <IconSizeProbe label="Outer" />
        </UnicaProvider>
        <section data-theme="frost-dark">
          <IconSizeProbe label="Outside providers" />
        </section>
      </>
    );
  }

  const sizeOf = (name: string): string | null =>
    screen.getByRole('button', { name }).getAttribute('data-size');
  const override = Object.freeze({ Icon: Object.freeze({ size: 's' as const }) });
  const { rerender } = render(<Scopes outerOverride={override} />);

  expect(sizeOf('Inner without override')).toBe('s');
  expect(sizeOf('Inner with missing axis')).toBe('s');
  expect(sizeOf('Inner with override')).toBe('l');
  expect(sizeOf('Outer')).toBe('s');
  expect(sizeOf('Outside providers')).toBe('inherit');

  const innerTheme: ThemeConfig = {
    preset: 'pixel-dark',
    defaults: { Icon: { size: 'l' } },
  };
  rerender(<Scopes innerTheme={innerTheme} outerOverride={override} />);
  expect(sizeOf('Inner without override')).toBe('s');

  rerender(<Scopes innerTheme={innerTheme} />);
  expect(sizeOf('Inner without override')).toBe('l');
  expect(sizeOf('Outer')).toBe('m');

  rerender(<Scopes />);
  expect(sizeOf('Inner without override')).toBe('m');

  rerender(<Scopes innerTheme={{ preset: 'pixel-dark' }} />);
  expect(sizeOf('Inner without override')).toBe('inherit');
  expect(sizeOf('Inner with override')).toBe('l');
  expect(sizeOf('Outer')).toBe('m');
});

it('keeps explicit slot sizes and ignores extra properties on structural config objects', () => {
  const onClick = vi.fn();
  const ref = vi.fn();
  const iconConfig = { size: 's', onClick, ref, 'aria-label': 'Hidden override' } as const;
  const overrides = { Icon: iconConfig } satisfies UnicaComponentDefaults;

  render(
    <UnicaProvider overrides={overrides}>
      <IconSizeProbe label="Standalone" />
      <IconSizeProbe label="Host typography" size="inherit" />
      <IconSizeProbe label="Host control" size="m" />
    </UnicaProvider>,
  );

  const standalone = screen.getByRole('button', { name: 'Standalone' });
  expect(standalone.getAttribute('data-size')).toBe('s');
  expect(screen.getByRole('button', { name: 'Host typography' }).style.width).toBe('1em');
  expect(screen.getByRole('button', { name: 'Host control' }).style.width).toBe(
    'var(--size-m-icon)',
  );
  fireEvent.click(standalone);
  expect(onClick).not.toHaveBeenCalled();
  expect(ref).not.toHaveBeenCalled();
});

it('hydrates the existing host and resolved defaults with the same config', () => {
  const theme: ThemeConfig = { preset: 'pixel-light', defaults: { Icon: { size: 'm' } } };
  const app = (
    <UnicaProvider theme={theme}>
      <section data-theme={theme.preset}>
        <IconSizeProbe label="Themed" />
      </section>
    </UnicaProvider>
  );
  const container = document.createElement('div');
  container.innerHTML = renderToString(app);
  const serverButton = container.querySelector('button');
  expect(serverButton?.getAttribute('data-size')).toBe('m');

  const onRecoverableError = vi.fn();
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const page = render(app, { container, hydrate: true, onRecoverableError });

  const button = page.getByRole('button');
  expect(button).toBe(serverButton);
  expect(button.getAttribute('data-size')).toBe('m');
  expect(container.firstElementChild?.getAttribute('data-theme')).toBe('pixel-light');
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
});

it('normalizes preset shorthand theme="pixel-dark" as a full ThemeConfig replacement', () => {
  render(
    <UnicaProvider theme={{ preset: 'soft-light', defaults: { Icon: { size: 'm' } } }}>
      <UnicaProvider theme="pixel-dark">
        <IconSizeProbe label="Shorthand inner" />
      </UnicaProvider>
      <IconSizeProbe label="Outer" />
    </UnicaProvider>,
  );

  expect(screen.getByRole('button', { name: 'Shorthand inner' }).getAttribute('data-size')).toBe(
    'inherit',
  );
  expect(screen.getByRole('button', { name: 'Outer' }).getAttribute('data-size')).toBe('m');
});

it('isolates split contexts with zero fan-out rerenders under React Profiler', () => {
  const Mark = defineGlyph((props) => <svg {...props} viewBox="0 0 16 16" />);
  const commits = {
    iconDefault: 0,
    iconExplicit: 0,
    linkDefault: 0,
    portalRead: 0,
  };
  const onRender = (id: string) => {
    if (id in commits) {
      commits[id as keyof typeof commits] += 1;
    }
  };

  const IconDefaultLeaf = memo(function IconDefaultLeaf() {
    return (
      <Profiler id="iconDefault" onRender={onRender}>
        <Icon icon={Mark} data-testid="prof-icon-default" />
      </Profiler>
    );
  });
  const IconExplicitLeaf = memo(function IconExplicitLeaf() {
    return (
      <Profiler id="iconExplicit" onRender={onRender}>
        <Icon icon={Mark} size="m" data-testid="prof-icon-explicit" />
      </Profiler>
    );
  });
  const LinkDefaultLeaf = memo(function LinkDefaultLeaf() {
    return (
      <Profiler id="linkDefault" onRender={onRender}>
        <Link href="#target" data-testid="prof-link-default">
          Docs
        </Link>
      </Profiler>
    );
  });
  const PortalReadLeaf = memo(function PortalReadLeaf() {
    const container = usePortalContainer();
    return (
      <Profiler id="portalRead" onRender={onRender}>
        <span data-testid="prof-portal">{container ? container.tagName : 'none'}</span>
      </Profiler>
    );
  });

  function Harness({
    tick,
    iconOverride,
    linkOverride,
  }: {
    readonly tick: number;
    readonly iconOverride: IconSize;
    readonly linkOverride?: LinkSize | undefined;
  }) {
    return (
      <UnicaProvider
        theme={{
          preset: 'frost-dark',
          defaults: { Icon: { size: 'm' }, Link: { size: 'body-s' } },
        }}
        overrides={{
          Icon: { size: iconOverride },
          ...(linkOverride ? { Link: { size: linkOverride } } : {}),
        }}
      >
        <span data-tick={tick} />
        <IconDefaultLeaf />
        <IconExplicitLeaf />
        <LinkDefaultLeaf />
        <PortalReadLeaf />
      </UnicaProvider>
    );
  }

  const { rerender } = render(<Harness tick={1} iconOverride="s" />);
  const baseline = { ...commits };
  expect(baseline.iconDefault).toBe(1);
  expect(baseline.iconExplicit).toBe(1);
  expect(baseline.linkDefault).toBe(1);

  // Equivalent inline theme + overrides literals must cause 0 extra rerenders anywhere.
  rerender(<Harness tick={2} iconOverride="s" />);
  expect(commits).toEqual(baseline);

  // Changing Icon.size rerenders ONLY IconDefaultLeaf, never explicit Icon, Link, or Portal consumers.
  rerender(<Harness tick={3} iconOverride="l" />);
  expect(commits.iconDefault).toBe(baseline.iconDefault + 1);
  expect(commits.iconExplicit).toBe(baseline.iconExplicit);
  expect(commits.linkDefault).toBe(baseline.linkDefault);
  expect(commits.portalRead).toBe(baseline.portalRead);
  expect(screen.getByTestId('prof-icon-default').getAttribute('data-unica-icon-size')).toBe('l');

  // Changing Link.size rerenders ONLY LinkDefaultLeaf.
  rerender(<Harness tick={4} iconOverride="l" linkOverride="body-l" />);
  expect(commits.iconDefault).toBe(baseline.iconDefault + 1);
  expect(commits.iconExplicit).toBe(baseline.iconExplicit);
  expect(commits.linkDefault).toBe(baseline.linkDefault + 1);
  expect(commits.portalRead).toBe(baseline.portalRead);
});

it('preserves child Fiber identity when toggling portalContainer or iconAdapter', () => {
  const host = document.body.appendChild(document.createElement('div'));
  let mounts = 0;
  let unmounts = 0;

  function Child() {
    useEffect(() => {
      mounts++;
      return () => {
        unmounts++;
      };
    }, []);
    return <span>stable</span>;
  }

  const { rerender, unmount } = render(
    <UnicaProvider theme="soft-dark">
      <Child />
    </UnicaProvider>,
  );
  expect([mounts, unmounts]).toEqual([1, 0]);

  rerender(
    <UnicaProvider theme="frost-dark" portalContainer={host} iconAdapter="native">
      <Child />
    </UnicaProvider>,
  );
  rerender(
    <UnicaProvider theme="pixel-light" portalContainer={null} iconAdapter="phosphor">
      <Child />
    </UnicaProvider>,
  );
  rerender(
    <UnicaProvider theme="soft-dark">
      <Child />
    </UnicaProvider>,
  );
  expect([mounts, unmounts]).toEqual([1, 0]);
  unmount();
  expect([mounts, unmounts]).toEqual([1, 1]);
  host.remove();
});

it('builds root data-theme attributes cleanly via client-free getUnicaRootProps', () => {
  expect(serverGetUnicaRootProps).toBe(getUnicaRootProps);

  const empty = getUnicaRootProps();
  expect(empty).toEqual({});
  expect(Object.keys(empty)).toEqual([]);
  expect('data-theme' in empty).toBe(false);

  const undef = getUnicaRootProps({ theme: undefined });
  expect(Object.keys(undef)).toEqual([]);

  // Spreading an omitted theme must never clobber an existing data-theme attribute.
  const preserved: Record<string, unknown> = { 'data-theme': 'soft-light', ...undef };
  expect(preserved['data-theme']).toBe('soft-light');

  const preset: ThemePreset = 'frost-dark';
  const fromString: UnicaRootAttributes = getUnicaRootProps({ theme: preset });
  const fromConfig: ServerRootAttributes = getUnicaRootProps({
    theme: { preset: 'pixel-light', defaults: { Link: { size: 'body-s' as ServerLinkSize } } },
  });
  expect(fromString).toEqual({ 'data-theme': 'frost-dark' });
  expect(fromConfig).toEqual({ 'data-theme': 'pixel-light' });
});
