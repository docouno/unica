import { Stack, Text } from '@docouno/unica';
import { AccountProfile } from './avatar-profile.examples.js';

export function ActionGeometry() {
  const samples = [
    { caption: 'Small · portrait', size: 's' },
    { caption: 'Medium · initials', src: '' },
    { caption: 'Large · unknown', size: 'l', name: '', src: '' },
    { caption: 'Secondary · portrait', secondary: true },
    { caption: 'Disabled · portrait', disabled: true },
    { caption: 'Disabled · initials', disabled: true, src: '' },
    { caption: 'Loading', loading: true },
    { caption: 'Wrapped label · 176px', secondary: true, label: 'Editorial workspace account' },
  ];

  return (
    <div
      data-example-disclosure=""
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 11rem), 1fr))',
        gap: 'var(--space-24)',
        inlineSize: 'min(100%, 40rem)',
      }}
    >
      {samples.map(({ caption, ...profile }) => (
        <Stack key={caption} gap={8} style={{ maxInlineSize: '11rem' }}>
          <Text as="span" size="caption-l" color="muted">
            <bdi>{caption}</bdi>
          </Text>
          <AccountProfile {...profile} />
        </Stack>
      ))}
    </div>
  );
}
