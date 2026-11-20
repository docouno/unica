import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { UnicaProvider, type ThemeConfig, type UnicaComponentDefaults } from '../src/index.js';
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
