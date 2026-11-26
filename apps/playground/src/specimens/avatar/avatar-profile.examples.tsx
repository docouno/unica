import { useId, useState } from 'react';
import { Avatar, Button, Stack, Text } from '@docouno/unica';

export function AccountProfile({
  avatarProps = {},
  size = 'm',
  name = 'Content editor',
  src = '/assets/avatar-person-light.png',
  label = 'Account',
  secondary = false,
  disabled = false,
  loading = false,
} = {}) {
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const buttonSize = size === 's' || size === 'l' ? size : 'm';
  const avatarSize = buttonSize === 's' ? '2xs' : buttonSize === 'l' ? 's' : 'xs';
  const diameter = buttonSize === 's' ? 20 : buttonSize === 'l' ? 32 : 24;
  const inset = `calc((var(--size-${buttonSize}-height) - ${diameter}px) / 2 - 1px)`;

  return (
    <Stack gap={8} align="start" style={{ inlineSize: 'min(100%, 18rem)' }}>
      <Button
        size={buttonSize}
        variant={secondary ? 'secondary' : 'ghost'}
        tone="neutral"
        disabled={disabled}
        loading={loading}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((previous) => !previous)}
        style={{ paddingBlock: inset, paddingInlineStart: inset }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `var(--size-${buttonSize}-gap)`,
            minInlineSize: 0,
          }}
        >
          <Avatar
            {...avatarProps}
            size={avatarSize}
            name={name}
            src={src || undefined}
            alt=""
            style={{ opacity: disabled ? 0.45 : undefined }}
          />
          <span style={{ minInlineSize: 0, textAlign: 'start', overflowWrap: 'anywhere' }}>
            {label}
          </span>
        </span>
      </Button>
      <section id={detailsId} aria-label="Account details" hidden={!open}>
        <Text size="body-s" weight="medium">
          {name || 'Workspace account'}
        </Text>
        <Text size="caption-l" color="muted">
          <bdi>editor@example.com</bdi>
        </Text>
      </section>
    </Stack>
  );
}
