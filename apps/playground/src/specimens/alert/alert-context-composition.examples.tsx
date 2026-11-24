import { useId, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertActions,
  AlertClose,
  AlertDescription,
  AlertTitle,
  Button,
  Code,
  Link,
  Stack,
  Text,
} from '@docouno/unica';
import { notices } from './alert-notices.js';

export function ContextNotice({ status = 'neutral', compact = false, alertProps = {} } = {}) {
  const notice = Object.values(notices).find((entry) => entry.status === status) ?? notices.neutral;
  const id = useId();
  const [shown, setShown] = useState(true);
  const [details, setDetails] = useState(false);
  const [guidance, setGuidance] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const focusTarget = useRef('');
  const toggleId = id + '-toggle';
  const detailId = id + '-details';
  const guideId = id + '-guidance';
  const receiptId = id + '-receipt';

  useLayoutEffect(() => {
    if (focusTarget.current) {
      const target = document.getElementById(focusTarget.current);
      focusTarget.current = '';
      const active = document.activeElement;
      if (
        target &&
        (active === document.body ||
          (active?.matches(':disabled') && document.getElementById(id)?.contains(active)))
      ) {
        target.focus();
      }
    }
  }, [shown, acknowledged, id]);

  if (!shown) {
    return (
      <Button
        id={toggleId}
        size="s"
        variant="ghost"
        tone="neutral"
        style={{ alignSelf: 'start' }}
        onClick={(event) => {
          if (event.currentTarget.matches(':focus')) {
            focusTarget.current = toggleId;
          }
          setShown(true);
        }}
      >
        Restore {notice.status} notice
      </Button>
    );
  }
  return (
    <Alert
      {...alertProps}
      id={id}
      role="none"
      status={notice.status}
      size={compact ? 's' : 'm'}
      close={
        <AlertClose
          id={toggleId}
          aria-label={`Dismiss ${notice.status} notice`}
          onClose={(event) => {
            const doc = event.currentTarget.ownerDocument;
            if (doc.getElementById(id)?.contains(doc.activeElement)) {
              focusTarget.current = toggleId;
            }
            setShown(false);
          }}
        />
      }
    >
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>
        <bdi>
          {notice.description} Reference: <Code>{notice.reference}</Code>.{' '}
          <Link href={'#' + guideId} tone="inherit" onClick={() => setGuidance(true)}>
            Read guidance
          </Link>
          .
        </bdi>
        <p id={guideId} hidden={!guidance} tabIndex={-1}>
          <bdi>{notice.guidance}</bdi>
        </p>
      </AlertDescription>
      <AlertActions>
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          style={{ minInlineSize: '8.25em' }}
          aria-expanded={details}
          aria-controls={detailId}
          onClick={() => setDetails(!details)}
        >
          {details ? 'Hide details' : 'Show details'}
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={acknowledged}
          onClick={(event) => {
            if (event.currentTarget.matches(':focus')) {
              focusTarget.current = receiptId;
            }
            setAcknowledged(true);
          }}
        >
          {acknowledged ? 'Acknowledged' : 'Acknowledge'}
        </Button>
      </AlertActions>
      <div id={detailId} hidden={!details}>
        <Text size="body-s">
          <bdi>{notice.detail}</bdi>
        </Text>
      </div>
      {acknowledged && (
        <div id={receiptId} tabIndex={-1}>
          <Text size="body-s">
            <bdi>Notice acknowledged.</bdi>
          </Text>
        </div>
      )}
    </Alert>
  );
}

export function ContextExamples({ alertProps = {} } = {}) {
  return (
    <Stack gap={24}>
      {Object.values(notices).map((notice) => (
        <ContextNotice key={notice.status} status={notice.status} alertProps={alertProps} />
      ))}
    </Stack>
  );
}
