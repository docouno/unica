import { useRef, useState } from 'react';
import { Button, Flex, FormField, Stack, Text, Textarea, VisuallyHidden } from '@docouno/unica';
import '@docouno/unica/styles.css';

const opening = 'A little context helps the next person pick up where you left off.';
const originalDraft = { sequence: 0, text: opening };
const silent = { revision: 0, text: '' };
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function inspectNote(text = '') {
  const count = Array.from(graphemes.segment(text)).length;
  const excess = count - 160;
  const error =
    excess > 0
      ? `Remove ${excess} ${excess === 1 ? 'character' : 'characters'} before saving. Your full draft is kept.`
      : text.trim()
        ? ''
        : 'Write a note before saving.';
  const message =
    error ||
    (count === 160
      ? 'At the suggested length. The full note is retained.'
      : count >= 144
        ? 'Almost at the suggested length. Keep the key idea.'
        : 'The note is ready to share.');
  return { count, error, message };
}

export function ReviewNote({
  fieldProps = {},
  loadedDraft = originalDraft,
  label = 'Review note',
  busy = false,
} = {}) {
  const lastLoad = useRef(0);
  const announcementRevision = useRef(0);
  const lastSave = useRef(0);
  const [value, setValue] = useState(loadedDraft.text);
  const [checked, setChecked] = useState(false);
  const [announcement, setAnnouncement] = useState(silent);
  const [submitted, setSubmitted] = useState('');
  function editDraft(text = '') {
    setValue(text);
    setChecked(false);
    setAnnouncement(silent);
  }
  function announce(text = '') {
    const revision = ++announcementRevision.current;
    setAnnouncement({ revision, text });
    return revision;
  }
  const { count, error, message } = inspectNote(value);
  const invalid = Boolean(error && (checked || count > 160));
  const warning = !error && count >= 144;
  const status = invalid ? 'danger' : warning ? 'warning' : checked ? 'success' : 'neutral';
  const hint =
    invalid || warning || checked ? message : 'Enter adds a new line. Escape keeps your draft.';

  return (
    <form
      aria-busy={busy || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) {
          return;
        }
        const note = new FormData(event.currentTarget).get('note');
        if (typeof note === 'string') {
          const error = inspectNote(note).error;
          if (error) {
            event.currentTarget.querySelector('textarea')?.setCustomValidity(error);
            event.currentTarget.reportValidity();
            return;
          }
          setValue(note);
          setSubmitted(note);
          setChecked(true);
          lastSave.current = announce('Draft saved.');
        }
      }}
      onReset={(event) => {
        const reset = event.nativeEvent;
        const field = event.currentTarget.querySelector('textarea');
        if (!field || !reset.isTrusted || reset.defaultPrevented) {
          return;
        }
        const beforeReset = announcementRevision.current;
        const listeners = new AbortController();
        // Custom validity survives native reset. Observe this form's own bubbling event
        // after the application's listeners, including a document that stops propagation.
        for (const target of [field.getRootNode(), field.ownerDocument.defaultView]) {
          target?.addEventListener(
            'reset',
            (current) => {
              if (current === reset) {
                field.setCustomValidity(
                  current.defaultPrevented ? inspectNote(field.value).error : '',
                );
              }
            },
            { signal: listeners.signal },
          );
        }
        setTimeout(() => {
          listeners.abort();
          field.setCustomValidity(inspectNote(field.value).error);
          if (!reset.defaultPrevented) {
            setValue(field.value);
            // A later check or save may already have observed the restored native value.
            if (announcementRevision.current === beforeReset) {
              setChecked(false);
              setAnnouncement(silent);
            }
            if (lastSave.current <= beforeReset) {
              setSubmitted('');
            }
          }
        }, 0);
      }}
    >
      <Stack gap={12}>
        <FormField
          label={label}
          required
          status={status}
          description={
            <bdi>
              Save up to 160 characters. You can paste a longer draft and shorten it before saving.
            </bdi>
          }
          message={<bdi>{hint}</bdi>}
          counter={
            <Text size="caption-l" color={invalid ? 'danger' : 'secondary'}>
              <bdi>{count} / 160 characters</bdi>
            </Text>
          }
        >
          <Textarea
            {...fieldProps}
            dir="auto"
            name="note"
            autosize
            minRows={3}
            maxRows={6}
            ref={(field) => {
              if (field && lastLoad.current !== loadedDraft.sequence) {
                lastLoad.current = loadedDraft.sequence;
                field.value = loadedDraft.text;
                field.setCustomValidity(inspectNote(field.value).error);
                editDraft(field.value);
              }
            }}
            onInvalid={(event) => {
              event.preventDefault();
              setValue(event.currentTarget.value);
              setChecked(true);
              announce(inspectNote(event.currentTarget.value).error);
              event.currentTarget.focus();
            }}
            defaultValue={opening}
            onInput={(event) => {
              const field = event.currentTarget;
              field.setCustomValidity(inspectNote(field.value).error);
              editDraft(field.value);
            }}
          />
        </FormField>
        <Flex gap={8} wrap="wrap">
          <Button
            type="button"
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={(event) => {
              const field = event.currentTarget.form?.querySelector('textarea');
              if (!field) {
                return;
              }
              setValue(field.value);
              setChecked(true);
              announce(inspectNote(field.value).message);
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
        <VisuallyHidden role="status">
          <bdi key={announcement.revision}>{announcement.text}</bdi>
        </VisuallyHidden>
        {submitted && (
          <Text as="p" size="body-s" color="secondary" style={{ whiteSpace: 'pre-wrap' }}>
            <bdi dir="ltr">
              Submitted draft: <bdi>{submitted}</bdi>
            </bdi>
          </Text>
        )}
      </Stack>
    </form>
  );
}
