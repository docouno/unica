import { Flex, Link, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

const underlineModes = Object.freeze({
  'Always underlined': 'always',
  'Underline on interaction': 'hover',
  'Current link underlined': 'none',
});
const target = { minInlineSize: 44, minBlockSize: 44, alignContent: 'center' };

export function LinkNavigationExample({
  subject = {},
  buttonHref = '/components/button',
  textHref = '/components/text',
} = {}) {
  return (
    <Stack gap={16}>
      {Object.entries(underlineModes).map(([label, underline]) => (
        <Stack key={underline} gap={4}>
          <Text size="caption-l" color="secondary">
            {label}
          </Text>
          <nav aria-label={`Component reference: ${label}`}>
            <Flex wrap="wrap" gap={12} align="baseline">
              <Link
                {...subject}
                href={buttonHref}
                tone="neutral"
                underline={underline}
                style={target}
              >
                Button
              </Link>
              <Link
                {...subject}
                href={textHref}
                tone="inherit"
                underline={underline}
                style={target}
              >
                Text
              </Link>
              <Link
                {...subject}
                href=""
                tone="neutral"
                underline={underline}
                style={target}
                aria-current="page"
              >
                Link
              </Link>
            </Flex>
          </nav>
        </Stack>
      ))}
    </Stack>
  );
}
