import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { Dropzone, FileInput, FileList, FileListItem, FormField } from '@docouno/unica';
import type { FileIntakeResult, FileListItemState } from '@docouno/unica';

function names(input: HTMLInputElement | null): string[] {
  return Array.from(input?.files ?? [], (file) => file.name);
}

type Authority = 'accept' | 'veto' | 'sync' | 'delay';

export default function FileAttachments(): ReactElement {
  const compact = useRef<HTMLInputElement>(null);
  const well = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<readonly File[]>(() => [
    new File(['verified content'], 'base.md', { type: 'text/markdown', lastModified: 15 }),
  ]);
  const deferred = useRef<readonly File[] | undefined>(undefined);
  const [log, setLog] = useState<readonly unknown[]>([]);
  const [authority, setAuthority] = useState<Authority>('accept');
  const [reset, setReset] = useState('');
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inert, setInert] = useState(false);
  const [otherOwner, setOtherOwner] = useState(false);
  const [multiple, setMultiple] = useState(true);

  function record(source: string, value: unknown, input: HTMLInputElement | null): void {
    const current = names(input);
    setLog((prior) => [...prior, [source, value, current]]);
    if (reset === source || reset === `cancel-${source}` || reset === `synthetic-${source}`) {
      const form = input?.form;
      if (reset.startsWith('cancel-')) {
        form?.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      }
      if (reset.startsWith('synthetic-')) {
        form?.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));
      } else {
        form?.reset();
      }
    }
  }

  function intake(label: string, input: HTMLInputElement | null, result: FileIntakeResult): void {
    record(
      label,
      {
        source: result.source,
        accepted: result.accepted.map(({ name }) => name),
        rejected: result.rejected.map(({ name, code }) => [name, code]),
      },
      input,
    );
  }

  return (
    <>
      <div>
        <label>
          Authority{' '}
          <select
            value={authority}
            onChange={(event) => setAuthority(event.target.value as Authority)}
          >
            <option value="accept">Accept</option>
            <option value="veto">Veto</option>
            <option value="sync">Flush</option>
            <option value="delay">Defer</option>
          </select>
        </label>
        <label>
          Reset during{' '}
          <select value={reset} onChange={(event) => setReset(event.target.value)}>
            {[
              '',
              'compact-value',
              'compact-intake',
              'well-value',
              'well-intake',
              'cancel-well-intake',
              'synthetic-compact-intake',
            ].map((mode) => (
              <option key={mode} value={mode}>
                {mode || 'Never'}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(event) => setReadOnly(event.target.checked)}
          />
          Read only
        </label>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />
          Disable fieldset
        </label>
        <label>
          <input
            type="checkbox"
            checked={loading}
            onChange={(event) => setLoading(event.target.checked)}
          />
          Loading
        </label>
        <label>
          <input
            type="checkbox"
            checked={inert}
            onChange={(event) => setInert(event.target.checked)}
          />
          Inert
        </label>
        <label>
          <input
            type="checkbox"
            checked={otherOwner}
            onChange={(event) => setOtherOwner(event.target.checked)}
          />
          External owner
        </label>
        <label>
          <input
            type="checkbox"
            checked={multiple}
            onChange={(event) => setMultiple(event.target.checked)}
          />
          Multiple
        </label>
        <button type="button" onClick={() => deferred.current && setFiles(deferred.current)}>
          Commit delayed
        </button>
        <button type="button" onClick={() => setFiles([])}>
          Clear controlled
        </button>
      </div>
      <form
        id="attachment-owner"
        action="/attachment-receipt"
        method="post"
        encType="multipart/form-data"
      >
        <FormField
          label="Mapping schema"
          required
          target={readOnly ? 'group' : 'control'}
          description="Author instructions."
          message="Check document mapping."
          status="danger"
        >
          <FileInput
            ref={compact}
            data-testid="compact"
            name="schema"
            accept=".md"
            maxSize={50_000}
            showSize
            allowPaste
            readOnly={readOnly}
            loading={loading}
            onValueChange={(next) =>
              record(
                'compact-value',
                next.map(({ name }) => name),
                compact.current,
              )
            }
            onIntake={(result) => intake('compact-intake', compact.current, result)}
          />
        </FormField>
        <input type="text" name="uploads" defaultValue="same-name control" />
        <fieldset disabled={disabled}>
          <legend>
            <FileInput name="legend" aria-label="Legend file" />
          </legend>
          <div inert={inert}>
            <FormField label="Bundle files" controlId="bundle" required>
              <Dropzone
                ref={well}
                data-testid="well"
                name="uploads"
                description="Author description."
                form={otherOwner ? 'external-owner' : undefined}
                accept=".md,.zip"
                maxSize={50_000}
                maxFiles={3}
                multiple={multiple}
                allowPaste
                value={files}
                readOnly={readOnly}
                loading={loading}
                onValueChange={(next) => {
                  record(
                    'well-value',
                    next.map(({ name }) => name),
                    well.current,
                  );
                  if (authority === 'accept') {
                    setFiles(next);
                  }
                  if (authority === 'sync') {
                    flushSync(() => setFiles(next));
                  }
                  if (authority === 'delay') {
                    deferred.current = next;
                  }
                }}
                onIntake={(result) => intake('well-intake', well.current, result)}
              />
            </FormField>
          </div>
        </fieldset>
        <button type="reset">Reset owner</button>
        <button type="submit">Submit attachments</button>
      </form>
      <form id="external-owner">
        <input type="text" name="uploads" defaultValue="other control" />
        <button type="reset">Reset external</button>
      </form>
      <label>
        Separate paste target <input />
      </label>
      <pre data-testid="events">{JSON.stringify(log)}</pre>
    </>
  );
}

const initialRows = ['alpha.md', 'disabled.md', 'beta.md', 'last.md'];
const initialPhase: FileListItemState = {
  phase: 'failed',
  reason: 'Connection lost',
  progress: 42,
};

export function FileAttachmentRows(): ReactElement {
  const intake = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState(initialRows);
  const [state, setState] = useState<FileListItemState>(initialPhase);
  const [removing, setRemoving] = useState<string>();
  const [error, setError] = useState('');
  const [actions, setActions] = useState<readonly string[]>([]);
  const [thumbnail, setThumbnail] = useState<File | string>();
  const [mountThumb, setMountThumb] = useState(true);
  const track = (value: string): void => setActions((list) => [...list, value]);
  return (
    <>
      <label>
        Unrelated field <input />
      </label>
      <FileInput ref={intake} name="file" aria-label="Choose another" />
      <button type="button" onClick={() => setState({ phase: 'uploading', progress: 0 })}>
        Transfer zero
      </button>
      <button type="button" onClick={() => setState({ phase: 'uploading', progress: 65 })}>
        Transfer progress
      </button>
      <button type="button" onClick={() => setState({ phase: 'uploading', progress: 100 })}>
        Transfer complete
      </button>
      <button type="button" onClick={() => setState({ phase: 'verifying' })}>
        Verify
      </button>
      <button type="button" onClick={() => setState({ phase: 'success' })}>
        Confirm upload
      </button>
      <button
        type="button"
        onClick={() => {
          setRows((current) => current.filter((name) => name !== removing));
          setRemoving(undefined);
        }}
      >
        Confirm removal
      </button>
      <button
        type="button"
        onClick={() => {
          setRemoving(undefined);
          setError('Could not remove this file.');
        }}
      >
        Reject removal
      </button>
      <div data-testid="queue">
        <FileList emptyFocusRef={intake} aria-label="Attachments">
          {rows.map((name) => (
            <FileListItem
              key={name}
              data-testid={name}
              name={name}
              fileSize={123}
              disabled={name === 'disabled.md'}
              state={state}
              removing={removing === name}
              removeError={name === 'alpha.md' ? error : undefined}
              onRetry={() => {
                track(`retry:${name}`);
                setState({ phase: 'uploading' });
              }}
              onRemove={() => {
                track(`remove:${name}`);
                setError('');
                setRemoving(name);
              }}
            />
          ))}
        </FileList>
      </div>
      <button type="button" onClick={() => setThumbnail('data:image/png,invalid')}>
        Broken thumbnail
      </button>
      <button
        type="button"
        onClick={() =>
          setThumbnail(
            new File(
              [
                '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><rect width="12" height="12" fill="green"/></svg>',
              ],
              'image.svg',
              { type: 'image/svg+xml' },
            ),
          )
        }
      >
        Local thumbnail
      </button>
      <button type="button" onClick={() => setMountThumb(false)}>
        Unmount thumbnail
      </button>
      <FileList aria-label="Saved references">
        {mountThumb && (
          <FileListItem
            name="saved.md"
            thumbnail={thumbnail}
            fileSize={0}
            readOnly
            href="data:text/plain,stored"
            onRemove={() => track('saved')}
          />
        )}
        <FileListItem name="local.md" href="data:text/plain,stored" state={{ phase: 'selected' }} />
      </FileList>
      <pre data-testid="row-actions">{actions.join(' ')}</pre>
    </>
  );
}
