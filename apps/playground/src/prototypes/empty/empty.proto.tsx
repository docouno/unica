import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { PlugsConnectedIcon } from '@phosphor-icons/react';
import './empty.css';

export interface EmptyProps extends Omit<ComponentPropsWithRef<'section'>, 'title'> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly media?: ReactNode;
}

export function Empty({
  title,
  description,
  icon,
  media,
  className = '',
  children,
  ...props
}: EmptyProps): ReactElement {
  return (
    <section {...props} className={`empty-proto ${className}`}>
      {media ? (
        <div className="empty-media-proto">{media}</div>
      ) : (
        <div className="empty-icon-proto" aria-hidden="true">
          {icon ?? <PlugsConnectedIcon size="1em" />}
        </div>
      )}
      <div className="empty-copy-proto">
        <h3>{title}</h3>
        {description && <div className="empty-description-proto">{description}</div>}
      </div>
      {children && <div className="empty-actions-proto">{children}</div>}
    </section>
  );
}
