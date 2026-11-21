import type { ComponentPropsWithRef, ReactElement } from 'react';
import './code-block.css';
import '../scrollbar/scrollbar.css';

export interface CodeBlockProps extends ComponentPropsWithRef<'pre'> {
  readonly language?: string;
}

export function CodeBlock({
  language,
  className = '',
  children,
  hidden,
  ...props
}: CodeBlockProps): ReactElement {
  return (
    <div className="code-block-frame-proto" hidden={hidden}>
      {language && <span className="code-language-proto">{language}</span>}
      <pre {...props} className={`code-block-proto scrollbar-proto ${className}`} dir="ltr">
        <code>{children}</code>
      </pre>
    </div>
  );
}
