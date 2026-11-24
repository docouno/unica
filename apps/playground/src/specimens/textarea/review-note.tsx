import { useId, useState } from 'react';
import { Button, Flex, Stack, Text, Textarea, VisuallyHidden } from '@docouno/unica';
import '@docouno/unica/styles.css';

const opening = 'A little context helps the next person pick up where you left off.';
const originalDraft = { sequence: 0, text: opening };
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function ReviewNote({
  fieldProps = {},
  loadedDraft = originalDraft,
  label = 'Review note',
  busy = false,
} = {}) {
  const id = useId();
  const [lastLoad, setLastLoad] = useState(loadedDraft.sequence);
  const [value, setValue] = useState(loadedDraft.text);
  const [checked, setChecked] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [submitted, setSubmitted] = useState('');
  if (loadedDraft.sequence !== lastLoad) {
    setLastLoad(loadedDraft.sequence);
    setValue(loadedDraft.text);
    setChecked(false);
  }
  const count = Array.from(graphemes.segment(value)).length;
  const excess = count - 160;
  const error =
    excess > 0
      ? `Remove ${excess} ${excess === 1 ? 'character' : 'characters'} before saving. Your full draft is kept.`
      : value.trim()
        ? ''
        : 'Write a note before saving.';
  const invalid = Boolean(error && (checked || excess > 0));
  const warning = !error && count >= 144;
  const status = invalid ? 'danger' : warning ? 'warning' : checked ? 'success' : 'neutral';
  const hint = invalid
    ? error
    : warning
      ? count === 160
        ? 'At the suggested length. The full note is retained.'
        : 'Almost at the suggested length. Keep the key idea.'
      : checked
        ? 'The note is ready to share.'
        : 'Enter adds a new line. Escape keeps your draft.';

  return (
    <form
      aria-busy={busy || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        if (busy || error) {
          return;
        }
        const note = new FormData(event.currentTarget).get('note');
        if (typeof note === 'string') {
          setSubmitted(note);
          setChecked(true);
          setAnnouncement('Draft saved.');
        }
      }}
      onReset={(event) => {
        const reset = event.nativeEvent;
        // Trusted keyboard activation can run microtasks between native reset listeners.
        setTimeout(() => {
          if (!reset.defaultPrevented) {
            setValue(opening);
            setChecked(false);
            setAnnouncement('');
            setSubmitted('');
          }
        }, 0);
      }}
    >
      <Stack gap={12}>
        <Stack gap={8}>
          <Text as="label" htmlFor={id} size="body-s" weight="medium">
            {label}
            <Text as="span" color="danger" aria-hidden="true">
              {' '}
              *
            </Text>
          </Text>
          <Textarea
            {...fieldProps}
            dir="auto"
            id={id}
            name="note"
            autosize
            minRows={3}
            maxRows={6}
            required
            aria-describedby={[id + '-help', id + '-message', id + '-count'].join(' ')}
            ref={(field) => {
              field?.setCustomValidity(error);
            }}
            onInvalid={(event) => {
              event.preventDefault();
              setChecked(true);
              setAnnouncement(error);
              event.currentTarget.focus();
            }}
            value={value}
            status={status}
            onChange={(event) => {
              setValue(event.currentTarget.value);
              setChecked(false);
            }}
          />
          <Text id={id + '-help'} size="caption-l" color="secondary">
            <bdi>
              Save up to 160 characters. You can paste a longer draft and shorten it before saving.
            </bdi>
          </Text>
          <Flex wrap="wrap" align="baseline" justify="space-between" gap={8}>
            <Text
              id={id + '-message'}
              size="caption-l"
              color={status === 'neutral' ? 'secondary' : status}
            >
              <bdi>{hint}</bdi>
            </Text>
            <Text id={id + '-count'} size="caption-l" color={invalid ? 'danger' : 'secondary'}>
              <bdi>{count} / 160 characters</bdi>
            </Text>
          </Flex>
        </Stack>
        <Flex gap={8} wrap="wrap">
          <Button
            type="button"
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() => {
              setChecked(true);
              setAnnouncement(error || (warning ? hint : 'The note is ready to share.'));
            }}
          >
            Check note
          </Button>
          <Button type="submit" size="s" loading={busy}>
            Submit draft
          </Button>
          <Button type="reset" size="s" variant="secondary" tone="neutral">
            Reset draft
          </Button>
        </Flex>
        <VisuallyHidden role="status">{announcement}</VisuallyHidden>
        {submitted && (
          <Text as="p" size="body-s" color="secondary" style={{ whiteSpace: 'pre-wrap' }}>
            <bdi>Submitted draft: </bdi>
            <bdi>{submitted}</bdi>
          </Text>
        )}
      </Stack>
    </form>
  );
}
