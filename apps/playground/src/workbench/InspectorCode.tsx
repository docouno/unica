import { useEffect, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

export function InspectorCode({ code }: { readonly code: string }): ReactElement {
  const [preview, setPreview] = useState<{ source: string; content: ReactNode }>();

  useEffect(() => {
    let active = true;
    const show = (content: ReactNode): void => {
      if (active) {
        setPreview({ source: code, content });
      }
    };
    import('./jsxPreview.js')
      .then(({ renderJsxPreview }) => renderJsxPreview(code))
      .then(show, () => show(code));
    return () => {
      active = false;
    };
  }, [code]);

  const ready = preview?.source === code;
  return (
    <pre className="wb-inspector-code" data-wb-pending={ready ? undefined : ''}>
      <code>{ready ? preview.content : code}</code>
    </pre>
  );
}
