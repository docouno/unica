import type { ReactElement, ReactNode } from 'react';
import './select.examples.css';

export function Study({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="select-study-proto">
      <div className="select-study-heading-proto">{title}</div>
      {children}
      {note && <p className="select-study-note-proto">{note}</p>}
    </div>
  );
}
export function StudyNote({ children }: { readonly children: ReactNode }): ReactElement {
  return <p className="select-study-note-proto">{children}</p>;
}
