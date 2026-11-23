import { useEffect, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

export interface InspectorCodeProps {
  readonly code: string;
  readonly language?: string;
  readonly format?: boolean;
  readonly copyable?: boolean;
  readonly standalone?: boolean;
  readonly label?: string;
  readonly copyName?: string;
  readonly onFormatted?: (formatted: string, source: string) => void;
}

export function InspectorCode({
  code,
  language = 'jsx',
  format = language === 'jsx',
  copyable = false,
  standalone = false,
  label,
  copyName,
  onFormatted,
}: InspectorCodeProps): ReactElement {
  const [preview, setPreview] = useState<{
    source: string;
    language: string;
    format: boolean;
    formatted: string;
    content: ReactNode;
  }>();
  const [copyStatus, setCopyStatus] = useState<{ text: string; source: string }>();

  useEffect(() => {
    let active = true;
    const show = (formatted: string, content: ReactNode): void => {
      if (active) {
        setPreview({ source: code, language, format, formatted, content });
        onFormatted?.(formatted, code);
      }
    };
    import('./jsxPreview.js')
      .then(({ renderJsxPreview }) => renderJsxPreview(code, language, format))
      .then(
        ({ formatted, content }) => show(formatted, content),
        () => show(code, code),
      );
    return () => {
      active = false;
    };
  }, [code, format, language, onFormatted]);

  const ready =
    preview?.source === code && preview.language === language && preview.format === format;
  const copyText = ready ? preview.formatted : code;
  const displayLabel = label ?? language;
  const activeStatus = copyStatus?.source === copyText ? copyStatus.text : undefined;

  const handleCopy = (): void => {
    const unavailable = (): void => {
      setCopyStatus({ text: 'Copy unavailable', source: copyText });
    };
    if (!navigator.clipboard) {
      unavailable();
      return;
    }
    navigator.clipboard.writeText(copyText).then(() => {
      setCopyStatus({ text: 'Copied', source: copyText });
    }, unavailable);
  };

  const pre = (
    <pre
      className="wb-inspector-code wb-scroll"
      data-wb-pending={ready ? undefined : ''}
      tabIndex={copyable || standalone ? 0 : undefined}
    >
      <code>{ready ? preview.content : code}</code>
    </pre>
  );

  if (!copyable) {
    return pre;
  }

  return (
    <div className={`wb-code-block${standalone ? ' wb-code-block-standalone' : ''}`}>
      <div className="wb-code-bar">
        <span className="wb-code-lang">{displayLabel}</span>
        <button
          type="button"
          className="wb-action-btn wb-code-copy"
          aria-label={copyName ?? `Copy ${displayLabel} snippet`}
          onClick={handleCopy}
        >
          {activeStatus ?? 'Copy'}
        </button>
        <span className="wb-sr-only" aria-live="polite" aria-atomic="true">
          {activeStatus ?? ''}
        </span>
      </div>
      {pre}
    </div>
  );
}
