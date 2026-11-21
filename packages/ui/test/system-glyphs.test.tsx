import { cleanup, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, expect, it } from 'vitest';
import { UnicaProvider } from '../src/index.js';
import {
  AlertDangerGlyph,
  AlertInfoGlyph,
  AlertSuccessGlyph,
  AlertWarningGlyph,
  CalendarGlyph,
  CaretGlyph,
  CheckGlyph,
  CloseGlyph,
  FieldDangerGlyph,
  FieldInfoGlyph,
  FieldSuccessGlyph,
  FieldWarningGlyph,
  MinusGlyph,
  UploadGlyph,
} from '../src/internal/glyphs/index.js';

function GlyphSet(): ReactElement {
  return (
    <>
      <CheckGlyph />
      <MinusGlyph />
      <CaretGlyph direction="up" />
      <CaretGlyph direction="down" />
      <CaretGlyph direction="left" />
      <CaretGlyph direction="right" />
      <button aria-label="Clear value">
        <CloseGlyph className="clear-glyph" />
      </button>
      <FieldInfoGlyph />
      <FieldSuccessGlyph />
      <FieldWarningGlyph />
      <FieldDangerGlyph />
      <AlertInfoGlyph />
      <AlertSuccessGlyph />
      <AlertWarningGlyph />
      <AlertDangerGlyph />
      <CalendarGlyph />
      <UploadGlyph />
    </>
  );
}

afterEach(cleanup);

it('renders the same decorative glyphs in different application contexts', () => {
  render(
    <>
      <div data-testid="plain" style={{ color: 'rgb(24, 56, 80)', fontSize: 14 }}>
        <GlyphSet />
      </div>
      <UnicaProvider iconAdapter={() => null}>
        <div data-testid="configured" style={{ color: 'rgb(80, 56, 24)', fontSize: 16 }}>
          <GlyphSet />
        </div>
      </UnicaProvider>
    </>,
  );

  const plain = Array.from(screen.getByTestId('plain').querySelectorAll('svg'));
  const configured = Array.from(screen.getByTestId('configured').querySelectorAll('svg'));
  expect(plain).toHaveLength(17);
  expect(configured.map((glyph) => glyph.outerHTML)).toEqual(plain.map((glyph) => glyph.outerHTML));

  const distinctPaths = new Set<string>();
  for (const glyph of plain) {
    expect(glyph.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(glyph.getAttribute('viewBox')).toBe('0 0 256 256');
    expect(glyph.getAttribute('width')).toBe('1em');
    expect(glyph.getAttribute('height')).toBe('1em');
    expect(glyph.getAttribute('fill')).toBe('currentColor');
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    expect(glyph.getAttribute('focusable')).toBe('false');
    expect(glyph.querySelector('title')).toBeNull();
    expect(glyph.hasAttribute('role')).toBe(false);
    expect(glyph.hasAttribute('tabindex')).toBe(false);

    const path = glyph.querySelector('path')?.getAttribute('d') ?? '';
    expect(path).toMatch(/^M.+Z$/);
    distinctPaths.add(path);
  }
  expect(distinctPaths.size).toBe(14);
  expect(screen.queryAllByRole('img')).toEqual([]);

  const [plainClear, configuredClear] = screen.getAllByRole('button', { name: 'Clear value' });
  expect(plainClear?.querySelector('.clear-glyph')).toBeInstanceOf(SVGElement);
  expect(configuredClear?.querySelector('.clear-glyph')).toBeInstanceOf(SVGElement);
  const [plainCheck] = plain;
  const [configuredCheck] = configured;
  expect(plainCheck && getComputedStyle(plainCheck).color).toBe('rgb(24, 56, 80)');
  expect(configuredCheck && getComputedStyle(configuredCheck).color).toBe('rgb(80, 56, 24)');
});

it('keeps caret directions physical inside RTL so the owning control can mirror logical actions', () => {
  const { container } = render(
    <div dir="rtl">
      <CaretGlyph direction="up" />
      <CaretGlyph direction="down" />
      <CaretGlyph direction="left" />
      <CaretGlyph direction="right" />
    </div>,
  );

  expect(
    Array.from(container.querySelectorAll('svg path'), (path) => path.getAttribute('transform')),
  ).toEqual([
    'rotate(180 128 128)',
    'rotate(0 128 128)',
    'rotate(90 128 128)',
    'rotate(-90 128 128)',
  ]);
});
