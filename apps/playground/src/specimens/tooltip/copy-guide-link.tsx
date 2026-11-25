import { useRef, useState } from 'react';
import { IconButton, Stack, Text, Tooltip } from '@docouno/unica';
import { CopyIcon } from '@phosphor-icons/react';
import '@docouno/unica/styles.css';

export function CopyGuideLink({ tooltipProps = {}, copyShortcut = false, subject = {} } = {}) {
  const [message, setMessage] = useState('');
  const lastRequest = useRef(0);

  function copyLink() {
    const request = ++lastRequest.current;
    function report(copied = false) {
      if (lastRequest.current === request) {
        setMessage(
          copied ? 'Tooltip guide link copied.' : 'Could not copy the tooltip guide link.',
        );
      }
    }
    if (!navigator.clipboard) {
      report();
      return;
    }
    navigator.clipboard.writeText('https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/').then(
      () => report(true),
      () => report(),
    );
  }

  return (
    <Stack align="start" gap={4}>
      <Tooltip
        label="Copy link"
        shortcut={copyShortcut ? 'Ctrl+C' : undefined}
        onOpenChange={(open, details) => console.log(open, details)}
        {...tooltipProps}
        {...subject}
      >
        <IconButton
          {...subject}
          aria-label="Copy link"
          icon={CopyIcon}
          onClick={copyLink}
          aria-keyshortcuts={copyShortcut ? 'Control+C' : undefined}
          onKeyDown={(event) => {
            if (
              copyShortcut &&
              !event.defaultPrevented &&
              !event.nativeEvent.isComposing &&
              event.ctrlKey &&
              !event.altKey &&
              !event.metaKey &&
              !event.shiftKey &&
              event.key.toLowerCase() === 'c'
            ) {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
        />
      </Tooltip>
      <Text dir="auto" size="body-s" color="secondary" role="status">
        {message}
      </Text>
    </Stack>
  );
}
