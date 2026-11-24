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
  Title,
} from '@docouno/unica';
import { notices } from './alert-notices.js';

export function ContextNotice({
  status = 'neutral',
  compact = false,
  alertProps = {},
  guidanceHref = '',
} = {}) {
  const notice = Object.values(notices).find((entry) => entry.status === status) ?? notices.neutral;
  const id = useId();
  const [shown, setShown] = useState(true);
  const [details, setDetails] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const focusTarget = useRef('');
  const toggleId = id + '-toggle';
  const detailId = id + '-details';
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
      <AlertTitle id={id + '-title'}>{notice.title}</AlertTitle>
      <AlertDescription>
        <bdi>
          {notice.description} Reference: <Code>{notice.reference}</Code>.
          {guidanceHref && (
            <>
              {' '}
              <Link href={guidanceHref} tone="inherit" aria-describedby={id + '-title'}>
                Read guidance
              </Link>
              .
            </>
          )}
        </bdi>
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

export function ContextExamples({ alertProps = {}, guidancePrefix = '' } = {}) {
  const id = useId();
  const prefix = guidancePrefix.trim().replace(/\s+/gu, '-') || id + '-guidance';

  // A linked guide can mount after the browser's initial fragment navigation.
  useLayoutEffect(() => {
    if (document.activeElement === document.body) {
      const targetId = Object.values(notices)
        .map((notice) => `${prefix}-${notice.status}`)
        .find((guideId) => window.location.hash === '#' + encodeURIComponent(guideId));
      if (targetId) {
        document.getElementById(targetId)?.focus();
      }
    }
  }, [prefix]);

  return (
    <Stack gap={24}>
      {Object.values(notices).map((notice) => (
        <ContextNotice
          key={notice.status}
          status={notice.status}
          alertProps={alertProps}
          guidanceHref={'#' + encodeURIComponent(`${prefix}-${notice.status}`)}
        />
      ))}
      <section aria-labelledby={`${prefix}-heading`}>
        <Stack gap={16}>
          <Title as="h2" size="heading-s" id={`${prefix}-heading`}>
            Notice guidance
          </Title>
          {Object.values(notices).map((notice) => {
            const guideId = `${prefix}-${notice.status}`;
            return (
              <article
                key={notice.status}
                id={guideId}
                aria-labelledby={guideId + '-heading'}
                tabIndex={-1}
                style={{ outlineOffset: 2 }}
              >
                <Title as="h3" size="body-m" id={guideId + '-heading'}>
                  <bdi>{notice.title}</bdi>
                </Title>
                <Text size="body-s" color="secondary">
                  <bdi>{notice.guidance}</bdi>
                </Text>
              </article>
            );
          })}
        </Stack>
      </section>
    </Stack>
  );
}
