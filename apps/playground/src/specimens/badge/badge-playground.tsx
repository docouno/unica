import { Badge, Stack, Text } from '@docouno/unica';
import { CheckCircleIcon, InfoIcon } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { badgeDetail, countNoun } from './badge-code.js';
import type { BadgeValues } from './badge.spec.js';

interface PlaygroundProps extends PreviewProps {
  readonly values: BadgeValues;
}

const glyphs = { none: undefined, CheckCircleIcon, InfoIcon } as const;

function BadgeSample({ ctx, values }: PlaygroundProps): ReactElement {
  const { element, href, disabled, children, status, size, dot, iconLeft } = values;
  const detailId = useId();
  const [expanded, setExpanded] = useState(false);
  const label = children.trim() ? children : '';
  const noun = countNoun(label);
  const linked = element === 'a' && href === 'details';
  const interactive = element === 'button' || linked;
  const name = noun && interactive ? label + ' ' + noun : undefined;
  const props = { ...ctx.subject, status, size, dot, iconLeft: glyphs[iconLeft] };
  let badge: ReactElement;
  if (element === 'button') {
    badge = (
      <Badge {...props} asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={name}
          aria-expanded={expanded}
          aria-controls={detailId}
          onClick={() => {
            ctx.action('onClick')(label);
            setExpanded((open) => !open);
          }}
        >
          {label}
        </button>
      </Badge>
    );
  } else if (element === 'a') {
    badge = (
      <Badge {...props} asChild>
        <a
          aria-label={name}
          href={linked ? '#' + detailId : undefined}
          onClick={linked ? () => ctx.action('onClick')(label) : undefined}
        >
          {label}
        </a>
      </Badge>
    );
  } else {
    badge = <Badge {...props}>{label}</Badge>;
  }

  return (
    <Stack
      align="start"
      gap={8}
      style={{ minInlineSize: 0 }}
      data-badge-comparison={ctx.tab === 'states' ? '' : undefined}
    >
      {noun ? (
        <bdi dir="ltr">
          {badge}{' '}
          <Text as="span" size="caption-l" aria-hidden={interactive || undefined}>
            {noun}
          </Text>
        </bdi>
      ) : (
        badge
      )}
      {label && interactive && (
        <Text
          id={detailId}
          size="body-s"
          hidden={!linked && disabled}
          style={!linked && !expanded ? { visibility: 'hidden' } : undefined}
          tabIndex={linked ? -1 : undefined}
        >
          <bdi>{badgeDetail}</bdi>
        </Text>
      )}
    </Stack>
  );
}

export function BadgePlayground(props: PlaygroundProps): ReactElement {
  return <BadgeSample key={JSON.stringify(props.values)} {...props} />;
}
