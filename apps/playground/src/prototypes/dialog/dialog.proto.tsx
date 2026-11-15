import { useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { IconButton } from '../button/button.proto.js';
import { Title } from '../title/title.proto.js';
import { Text } from '../text/text.proto.js';
import './dialog.css';
import '../scrollbar/scrollbar.css';

export interface DialogPreviewProps {
  readonly open?: boolean;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly onClose?: () => void;
  readonly className?: string;
}

interface DialogSurfaceProps extends DialogPreviewProps {
  readonly side: 'center' | 'end';
}

// A bounded visual layer keeps each theme preview independent in the matrix.
// The native modal lifecycle is part of the library implementation.
function DialogSurface({
  open = true,
  title,
  description,
  children,
  footer,
  onClose,
  className = '',
  side,
}: DialogSurfaceProps): ReactElement | null {
  const titleId = useId();
  const descriptionId = useId();
  if (!open) {
    return null;
  }
  return (
    <div className={`dialog-preview-layer ${className}`} data-side={side}>
      <button
        className="dialog-preview-scrim"
        type="button"
        aria-label={`Close ${title}`}
        onClick={onClose}
        tabIndex={-1}
      />
      <section
        className="dialog-preview-surface"
        data-surface="overlay"
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="dialog-preview-header">
          <div>
            <Title as="h2" size="heading-s" id={titleId}>
              {title}
            </Title>
            {description && (
              <Text size="body-s" color="secondary" id={descriptionId}>
                {description}
              </Text>
            )}
          </div>
          <IconButton
            variant="ghost"
            size="s"
            icon={XIcon}
            aria-label={`Close ${title}`}
            onClick={onClose}
          />
        </header>
        <div className="dialog-preview-body scrollbar-proto">{children}</div>
        {footer && <footer className="dialog-preview-footer">{footer}</footer>}
      </section>
    </div>
  );
}

export function Modal(props: DialogPreviewProps): ReactElement | null {
  return <DialogSurface {...props} side="center" />;
}
export function Drawer(props: DialogPreviewProps): ReactElement | null {
  return <DialogSurface {...props} side="end" />;
}
