import type { ReactElement, ReactNode } from 'react';
export function DateStudy({
  label,
  note,
  children,
}: {
  readonly label: string;
  readonly note?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="date-study-proto">
      <p className="date-study-label-proto">{label}</p>
      {children}
      {note && <p className="date-study-note-proto">{note}</p>}
    </div>
  );
}
