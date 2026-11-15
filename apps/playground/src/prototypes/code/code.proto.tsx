import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import './code.css';
import '../scrollbar/scrollbar.css';

export type CodeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'inherit';

export interface CodeProps extends ComponentPropsWithRef<'code'> {
  readonly size?: 'inherit' | 's' | 'm' | 'l';
  readonly tone?: CodeTone;
  readonly plate?: boolean;
}

// Design reference only; these controls do not freeze the package API.
export function Code({
  size = 'inherit',
  tone = 'neutral',
  plate = true,
  dir = 'ltr',
  className = '',
  ...props
}: CodeProps): ReactElement {
  return (
    <code
      {...props}
      className={`code-proto ${className}`}
      dir={dir}
      data-size={size}
      data-tone={tone}
      data-plate={plate}
    />
  );
}

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

export interface BlockquoteProps extends Omit<ComponentPropsWithRef<'blockquote'>, 'cite'> {
  readonly cite?: ReactNode;
}

export function Blockquote({
  cite,
  className = '',
  children,
  ...props
}: BlockquoteProps): ReactElement {
  return (
    <blockquote {...props} className={`blockquote-proto ${className}`}>
      {children}
      {cite && <footer>{cite}</footer>}
    </blockquote>
  );
}
