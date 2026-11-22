import { cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Stack,
  VisuallyHidden,
  type Spacing,
} from '../src/index.js';

afterEach(cleanup);

describe('Layout primitives', () => {
  it('maps numeric Spacing steps to --space-* custom properties across breakpoints', () => {
    const gap: Spacing = 12;
    const { container } = render(
      <Box padding={{ mobile: 8, tablet: 16, desktop: 24 }} marginBlockEnd={0}>
        <Flex gap={gap} align="center" justify="space-between">
          <Stack gap={{ mobile: 4, wide: 32 }}>
            <Grid columns={{ mobile: 1, desktop: 3 }} gap={16}>
              <GridItem span={{ desktop: 2 }}>Cell</GridItem>
            </Grid>
          </Stack>
        </Flex>
      </Box>,
    );

    const box = container.querySelector<HTMLElement>('.unica-box')!;
    expect(box.style.getPropertyValue('--_box-padding-mobile')).toBe('var(--space-8)');
    expect(box.style.getPropertyValue('--_box-padding-tablet')).toBe('var(--space-16)');
    expect(box.style.getPropertyValue('--_box-padding-desktop')).toBe('var(--space-24)');
    expect(box.style.getPropertyValue('--_box-margin-block-end-mobile')).toBe('var(--space-0)');

    const flex = container.querySelector<HTMLElement>('.unica-flex')!;
    expect(flex.style.getPropertyValue('--_flow-gap-mobile')).toBe('var(--space-12)');

    const stack = container.querySelector<HTMLElement>('.unica-stack')!;
    expect(stack.style.getPropertyValue('--_flow-gap-mobile')).toBe('var(--space-4)');
    expect(stack.style.getPropertyValue('--_flow-gap-wide')).toBe('var(--space-32)');

    const grid = container.querySelector<HTMLElement>('.unica-grid')!;
    expect(grid.style.getPropertyValue('--_grid-gap-mobile')).toBe('var(--space-16)');
  });

  it('binds Container sizes to --container-* tokens and emits data-unica-container-align', () => {
    const { container } = render(
      <>
        <Container data-testid="default">Default</Container>
        <Container size="s" centered={false} gutter={24} data-testid="start">
          Start
        </Container>
        <Container size={{ mobile: 's', desktop: 'l' }} data-testid="responsive">
          Responsive
        </Container>
      </>,
    );

    const def = container.querySelector<HTMLElement>('[data-testid="default"]')!;
    expect(def.style.getPropertyValue('--_container-width-mobile')).toBe('');
    expect(def.hasAttribute('data-unica-container-align')).toBe(false);

    const start = container.querySelector<HTMLElement>('[data-testid="start"]')!;
    expect(start.style.getPropertyValue('--_container-width-mobile')).toBe('var(--container-s)');
    expect(start.style.getPropertyValue('--_container-gutter-mobile')).toBe('var(--space-24)');
    expect(start.getAttribute('data-unica-container-align')).toBe('start');

    const responsive = container.querySelector<HTMLElement>('[data-testid="responsive"]')!;
    expect(responsive.style.getPropertyValue('--_container-width-mobile')).toBe(
      'var(--container-s)',
    );
    expect(responsive.style.getPropertyValue('--_container-width-desktop')).toBe(
      'var(--container-l)',
    );
  });

  it('renders VisuallyHidden as span by default or div with forwarded ref and attributes', () => {
    const spanRef = createRef<HTMLSpanElement>();
    const divRef = createRef<HTMLDivElement>();
    const { container, unmount } = render(
      <>
        <VisuallyHidden ref={spanRef} id="sr-span" className="extra" data-hint="status">
          Inline screen-reader note
        </VisuallyHidden>
        <VisuallyHidden as="div" ref={divRef} id="sr-div">
          Block screen-reader note
        </VisuallyHidden>
      </>,
    );

    const span = container.querySelector('#sr-span')!;
    const div = container.querySelector('#sr-div')!;
    expect(span.tagName).toBe('SPAN');
    expect(spanRef.current).toBe(span);
    expect(span.classList.contains('unica-visually-hidden')).toBe(true);
    expect(span.classList.contains('extra')).toBe(true);
    expect(span.getAttribute('data-hint')).toBe('status');
    expect(span.textContent).toBe('Inline screen-reader note');

    expect(div.tagName).toBe('DIV');
    expect(divRef.current).toBe(div);
    expect(div.classList.contains('unica-visually-hidden')).toBe(true);
    expect(div.textContent).toBe('Block screen-reader note');

    unmount();
    expect(spanRef.current).toBeNull();
    expect(divRef.current).toBeNull();
  });
});
