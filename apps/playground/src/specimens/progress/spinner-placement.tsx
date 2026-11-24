import { useId, useState } from 'react';
import { LinkSimpleIcon } from '@phosphor-icons/react';
import { Flex, Input, Spinner, Stack, Text } from '@docouno/unica';

export function WorkspaceAddressCheck({
  placement = 'inline',
  outcome = 'pending',
  requestedAddress = 'workspace.example',
  announce = true,
  spinnerProps = {},
} = {}) {
  const inputId = useId();
  const hintId = useId();
  const [draft, setDraft] = useState(requestedAddress);
  const matchesRequest = draft !== '' && draft === requestedAddress;
  const inField = placement === 'field';
  const checking = matchesRequest && outcome === 'pending';
  let message = 'This address has not been checked.';
  if (!draft) {
    message = 'Enter a workspace address.';
  } else if (checking) {
    message = 'Checking address availability…';
  } else if (matchesRequest && outcome === 'available') {
    message = 'This address is available.';
  }

  return (
    <Stack gap={8} style={{ inlineSize: 'min(100%, 28rem)' }}>
      <Text as="label" htmlFor={inputId} size="body-s" weight="medium">
        Workspace address
      </Text>
      <Input
        id={inputId}
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        aria-describedby={hintId}
        loading={inField && checking}
        iconRight={LinkSimpleIcon}
        autoCapitalize="none"
        spellCheck={false}
      />
      <Flex align="start" gap={8} style={{ minBlockSize: 'calc(2 * var(--text-size-body-s-lh))' }}>
        {!inField && (
          <span
            aria-hidden="true"
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              flex: 'none',
              inlineSize: 'var(--size-s-icon)',
              blockSize: 'var(--text-size-body-s-lh)',
            }}
          >
            {checking && <Spinner {...spinnerProps} size="s" tone="muted" />}
          </span>
        )}
        <Text
          as="span"
          id={hintId}
          size="body-s"
          color="muted"
          role={announce ? 'status' : undefined}
        >
          <bdi>{message}</bdi>
        </Text>
      </Flex>
    </Stack>
  );
}
