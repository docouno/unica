import '@fontsource-variable/inter';
import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/jetbrains-mono/wght-italic.css';
import { Text, Title } from '@docouno/unica';
import type { TextColor, TextSize, TitleSize } from '@docouno/unica';
import type { CSSProperties, JSX } from 'react';

const textSizes = [
  'body-l',
  'body-m',
  'body-s',
  'body-xs',
  'caption-l',
  'caption-m',
  'caption-s',
] as const satisfies readonly TextSize[];
const titleSizes = [
  'display-l',
  'display-m',
  'display-s',
  'heading-xl',
  'heading-l',
  'heading-m',
  'heading-s',
  'body-m',
] as const satisfies readonly TitleSize[];
const colors = {
  primary: '--fg-primary',
  secondary: '--fg-secondary',
  muted: '--fg-muted',
  subtle: '--fg-subtle',
  accent: '--accent-soft-fg',
  info: '--status-info-soft-fg',
  success: '--status-success-soft-fg',
  warning: '--status-warning-soft-fg',
  danger: '--status-danger-soft-fg',
} as const satisfies Partial<Record<TextColor, string>>;
const explicitColors = Object.keys(colors) as (keyof typeof colors)[];

const copy =
  'Read the release checklist before deploying changes and hand the complete record to the next team.';
const wrapCopy = 'First second third fourth fifth sixth seventh eighth ninth';
const measure: CSSProperties = { inlineSize: 164, whiteSpace: 'nowrap' };

function InkSamples(): JSX.Element {
  return (
    <div style={{ background: 'var(--bg-canvas)', color: 'var(--fg-primary)' }}>
      {(['canvas', 'surface', 'overlay'] as const).map((surface) => (
        <section
          key={surface}
          data-ink-surface={surface}
          data-surface={surface === 'overlay' ? 'overlay' : 'base'}
          style={{ background: `var(--bg-${surface})` }}
        >
          {explicitColors.map((color) => (
            <div key={color} data-ink-role={color}>
              <Text size="body-xs" color={color}>
                Text foreground
              </Text>
              <Title as="h3" size="body-m" color={color}>
                Title foreground
              </Title>
              <span style={{ color: `var(${colors[color]})` }}>Token sample</span>
            </div>
          ))}
        </section>
      ))}
      <div data-testid="ink-owner" style={{ color: 'var(--status-info-soft-fg)' }}>
        <Text data-testid="ink-inherit">Context foreground</Text>
        <Title as="h3" data-testid="heading-inherit" color="inherit">
          Context heading
        </Title>
        <a href="#fixture">
          <Text as="span" color="danger" data-testid="system-link-text">
            System link text
          </Text>
        </a>
      </div>
    </div>
  );
}

export default function TypographyFixture(): JSX.Element {
  return (
    <div id="fixture" style={{ background: 'var(--bg-canvas)', color: 'var(--fg-primary)' }}>
      <form data-testid="native-form" style={{ inlineSize: 170 }}>
        {['first', 'second'].map((id) => (
          <div key={id} data-field={id}>
            <Text as="label" htmlFor={id} truncate>
              Long linked label with a complete accessible name
            </Text>
            <input id={id} name={id} defaultValue={id} />
          </div>
        ))}
        <Title as="h2" size="body-m" lineClamp={2} data-testid="named-heading">
          Editorial heading with a complete <a href="#fixture">accessible name</a>
        </Title>
        <Title as="h3" size="heading-s" tabIndex={-1}>
          Programmatic destination
        </Title>
      </form>

      {textSizes.map((size) => (
        <Text key={size} size={size} data-text-metric={size}>
          Type sample
        </Text>
      ))}
      {titleSizes.map((size) => (
        <Title key={size} as="h2" size={size} data-title-metric={size}>
          Heading sample
        </Title>
      ))}
      <Text as="em" data-testid="italic-text">
        Italic text
      </Text>
      <Text as="em" italic={false} data-testid="upright-em">
        Upright emphasis
      </Text>
      <div style={{ fontStyle: 'italic' }}>
        <Title data-testid="italic-context-title">Inherited italic</Title>
        <Title italic={false} data-testid="upright-title">
          Upright title
        </Title>
        <Text as="span" data-testid="upright-text">
          Upright inline text
        </Text>
      </div>
      <Title italic data-testid="italic-title">
        Italic title
      </Title>

      <div style={{ inlineSize: 240, textAlign: 'end' }}>
        {(['start', 'center', 'end', undefined] as const).map((align) => (
          <div key={align ?? 'inherit'} data-align-sample={align ?? 'inherit'}>
            <Text align={align}>Text alignment</Text>
            <Title as="h2" size="body-m" align={align}>
              Title alignment
            </Title>
          </div>
        ))}
      </div>
      <div>
        <Text as="span" tabularNums data-testid="tabular-text">
          1111
        </Text>
        <Title as="h2" size="body-m" tabularNums data-testid="tabular-title">
          8888
        </Title>
        <Text as="span" data-testid="auto-digits">
          0123
        </Text>
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>
          <Text as="span" tabularNums={false} data-testid="inherited-digits">
            0123
          </Text>
        </div>
      </div>

      <div style={measure}>
        <Text data-testid="text-default-wrap">{copy}</Text>
        <Title as="h2" size="body-m" data-testid="title-default-wrap">
          {copy}
        </Title>
        {(['wrap', 'nowrap', 'pretty', 'balance'] as const).map((textWrap) => (
          <Title
            key={textWrap}
            as="h2"
            size="body-m"
            textWrap={textWrap}
            data-testid={`title-${textWrap}`}
          >
            {copy}
          </Title>
        ))}
        <Title as="h2" textWrap="wrap" data-testid="title-short">
          Short
        </Title>
        <Text as="div" truncate data-testid="block-truncate">
          {copy}
        </Text>
        <div>
          <Text as="span" truncate data-testid="inline-truncate">
            {copy}
          </Text>
        </div>
        <div>
          <Text as="span" truncate data-testid="inline-short">
            Short
          </Text>
        </div>
        {[1, 2, 3].map((lines) => (
          <Text as="span" key={lines} lineClamp={lines} data-testid={`clamp-${lines}`}>
            {copy}
          </Text>
        ))}
        <Title
          as="h2"
          size="body-m"
          textWrap="nowrap"
          truncate
          lineClamp={2}
          style={{ WebkitLineClamp: 4 }}
          data-testid="priority"
        >
          {copy}
        </Title>
        <Title as="h2" size="body-m" textWrap="balance" truncate data-testid="truncate-title">
          {copy}
        </Title>
        <Text hidden as="span" truncate data-testid="hidden-truncate">
          Hidden truncated text
        </Text>
        <Title hidden lineClamp={2} data-testid="hidden-clamp">
          Hidden clamped heading
        </Title>
      </div>
      <div style={{ inlineSize: 164 }}>
        {[0, -3, 1.5, NaN, Infinity, -Infinity].map((value) => (
          <div key={String(value)} data-invalid-clamp={String(value)}>
            <Text lineClamp={value} truncate>
              {copy}
            </Text>
            <Title as="h2" size="body-m" lineClamp={value}>
              {copy}
            </Title>
          </div>
        ))}
        <Text data-testid="long-word">{'Unbroken'.repeat(12)}</Text>
      </div>
      <div style={{ inlineSize: 220 }}>
        <Title as="h2" size="body-m" data-testid="ordinary-wrap-reference">
          {wrapCopy}
        </Title>
        <div style={{ textWrap: 'balance' }}>
          <Title as="h2" size="body-m" data-testid="wrap-under-balance">
            {wrapCopy}
          </Title>
          <Title as="h2" size="body-m" textWrap="wrap" data-testid="explicit-wrap-under-balance">
            {wrapCopy}
          </Title>
          <Title as="h2" size="body-m" textWrap="balance" data-testid="explicit-balance">
            {wrapCopy}
          </Title>
          <Title as="h2" size="body-m" lineClamp={1} data-testid="title-clamp-under-balance">
            {wrapCopy}
          </Title>
          <Text lineClamp={1} data-testid="text-clamp-under-balance">
            {wrapCopy}
          </Text>
        </div>
      </div>
      <InkSamples />
    </div>
  );
}
