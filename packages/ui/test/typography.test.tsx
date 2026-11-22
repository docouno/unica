import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../src/core/devWarning.js';
import { Text, Title } from '../src/index.js';

afterEach(() => {
  cleanup();
  resetDevWarnings();
  vi.restoreAllMocks();
});

it('renders a single native Text root with semantic defaults and explicit overrides', () => {
  const { container } = render(
    <>
      <Text>Paragraph</Text>
      <Text as="div">Block</Text>
      <Text as="span">Inline</Text>
      <Text as="label" htmlFor="field">
        Label
      </Text>
      <Text as="strong">Strong</Text>
      <Text as="em">Emphasis</Text>
      <Text as="strong" weight="light">
        Light strong
      </Text>
      <Text as="em" italic={false}>
        Upright emphasis
      </Text>
    </>,
  );

  expect([...container.children].map((node) => node.localName)).toEqual([
    'p',
    'div',
    'span',
    'label',
    'strong',
    'em',
    'strong',
    'em',
  ]);
  expect(screen.getByText('Label').getAttribute('for')).toBe('field');
  expect(screen.getByText('Paragraph').style.getPropertyValue('--_type-size')).toBe(
    'var(--text-size-body-m)',
  );
  expect(screen.getByText('Strong').style.getPropertyValue('--_type-weight')).toBe('700');
  expect(screen.getByText('Light strong').style.getPropertyValue('--_type-weight')).toBe('300');
  expect(screen.getByText('Emphasis').dataset.unicaTypeStyle).toBe('italic');
  expect(screen.getByText('Upright emphasis').dataset.unicaTypeStyle).toBe('normal');
});

it('renders all six native heading levels with independent sizes', () => {
  render(
    <>
      <Title>One</Title>
      <Title as="h2">Two</Title>
      <Title as="h3">Three</Title>
      <Title as="h4">Four</Title>
      <Title as="h5">Five</Title>
      <Title as="h6">Six</Title>
      <Title as="h2" size="heading-m">
        Compact section
      </Title>
    </>,
  );

  expect(
    screen.getAllByRole('heading').map((node) => [node.localName, node.dataset.unicaTitleSize]),
  ).toEqual([
    ['h1', 'display-s'],
    ['h2', 'heading-xl'],
    ['h3', 'heading-l'],
    ['h4', 'heading-m'],
    ['h5', 'heading-s'],
    ['h6', 'body-m'],
    ['h2', 'heading-m'],
  ]);
});

it('forwards native attributes, events, and React 19 refs to the selected roots', () => {
  const labelRef = createRef<HTMLLabelElement>();
  const headingRef = vi.fn<(node: HTMLHeadingElement | null) => void>();
  const onClick = vi.fn();
  const { unmount } = render(
    <>
      <Text
        as="label"
        ref={labelRef}
        htmlFor="name"
        onClick={onClick}
        className="field-label"
        style={{ fontSize: 19 }}
      >
        Name
      </Text>
      <input id="name" />
      <Title
        as="h3"
        ref={headingRef}
        id="result"
        data-testid="result"
        aria-describedby="hint"
        dir="rtl"
        title="Explicit hint"
        tabIndex={-1}
      >
        Results
      </Title>
    </>,
  );

  const label = screen.getByText('Name');
  expect(labelRef.current).toBe(label);
  expect(label.classList.contains('field-label')).toBe(true);
  expect(label.style.fontSize).toBe('19px');
  fireEvent.click(label);
  expect(onClick).toHaveBeenCalledTimes(1);

  const heading = screen.getByRole('heading', { level: 3, name: 'Results' });
  expect(headingRef).toHaveBeenCalledWith(heading);
  expect(screen.getByTestId('result')).toBe(heading);
  expect(heading.id).toBe('result');
  expect(heading.dir).toBe('rtl');
  expect(heading.title).toBe('Explicit hint');
  expect(heading.tabIndex).toBe(-1);
  expect(heading.getAttribute('aria-describedby')).toBe('hint');

  unmount();
  expect(labelRef.current).toBeNull();
  expect(headingRef.mock.lastCall?.[0]).toBeNull();
});

it('renders deterministic provider-free SSR without leaking styling props or changing the text', () => {
  const example = (
    <Title
      as="h2"
      size="heading-m"
      weight="bold"
      color="success"
      align="end"
      italic={false}
      tabularNums
      truncate
      lineClamp={2}
      textWrap="nowrap"
      hidden
      style={{ WebkitLineClamp: 8 }}
    >
      Long heading with the full <a href="/guide">linked text</a>
    </Title>
  );
  const markup = renderToStaticMarkup(example);
  expect(renderToStaticMarkup(example)).toBe(markup);

  const template = document.createElement('template');
  template.innerHTML = markup;
  expect(template.content.children.length).toBe(1);
  const heading = template.content.querySelector('h2');
  expect(heading?.hidden).toBe(true);
  expect(heading?.style.webkitLineClamp).toBe('2');
  expect(heading?.textContent).toBe('Long heading with the full linked text');
  expect(heading?.querySelector('a')?.getAttribute('href')).toBe('/guide');
  for (const attribute of [
    'as',
    'size',
    'weight',
    'color',
    'align',
    'italic',
    'tabularnums',
    'truncate',
    'lineclamp',
    'textwrap',
    'title',
    'role',
    'tabindex',
    'aria-label',
  ]) {
    expect(heading?.hasAttribute(attribute)).toBe(false);
  }
});

it('warns once in development and ignores non-positive lineClamp values', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { container } = render(
    <>
      <Text lineClamp={0}>Zero</Text>
      <Text lineClamp={-2}>Negative</Text>
      <Text lineClamp={2}>Valid</Text>
    </>,
  );
  expect(warn).toHaveBeenCalledTimes(1);
  const paragraphs = container.querySelectorAll('p');
  expect(paragraphs[0]?.hasAttribute('data-unica-type-overflow')).toBe(false);
  expect(paragraphs[0]?.style.webkitLineClamp).toBe('');
  expect(paragraphs[1]?.hasAttribute('data-unica-type-overflow')).toBe(false);
  expect(paragraphs[1]?.style.webkitLineClamp).toBe('');
  expect(paragraphs[2]?.getAttribute('data-unica-type-overflow')).toBe('clamp');
  expect(paragraphs[2]?.style.webkitLineClamp).toBe('2');
});
