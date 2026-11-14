import { useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';
import './accordion.css';

export function Accordion({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`accordion-proto ${className}`} />;
}

export interface CollapsibleProps extends Omit<ComponentPropsWithRef<'details'>, 'title'> {
  readonly title: ReactNode;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export function Collapsible({
  title,
  defaultOpen = false,
  open,
  onOpenChange,
  onToggle,
  className = '',
  children,
  ...props
}: CollapsibleProps): ReactElement {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  return (
    <details
      {...props}
      className={`collapsible-proto ${className}`}
      open={open ?? localOpen}
      onToggle={(event) => {
        onToggle?.(event);
        if (open === undefined) {
          setLocalOpen(event.currentTarget.open);
        }
        onOpenChange?.(event.currentTarget.open);
      }}
    >
      <summary>
        <span>{title}</span>
        <CaretDownIcon className="collapsible-chevron-proto" size="1em" aria-hidden="true" />
      </summary>
      <div className="collapsible-body-proto">{children}</div>
    </details>
  );
}
