import { cloneElement, useId } from 'react';
import type {
  AriaAttributes,
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  MouseEventHandler,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';
import './list.css';

type ListSize = 's' | 'm' | 'l';

type ListProps = ComponentPropsWithoutRef<'ul'> & {
  readonly size?: ListSize;
  readonly markers?: boolean;
  readonly dividers?: boolean;
  readonly reserveLeading?: boolean;
} & (
    | { readonly as?: 'ul'; readonly ref?: Ref<HTMLUListElement> }
    | {
        readonly as: 'ol';
        readonly ref?: Ref<HTMLOListElement>;
        readonly start?: number;
        readonly reversed?: boolean;
      }
  );

export function List({
  markers = true,
  dividers = false,
  reserveLeading = false,
  size,
  className = '',
  ...props
}: ListProps): ReactElement {
  const attributes = {
    className: `list-proto ${className}`,
    role: markers ? props.role : 'list',
    'data-markers': markers,
    'data-dividers': dividers || undefined,
    'data-reserve-leading': reserveLeading || undefined,
    'data-size': size,
  };

  if (props.as === 'ol') {
    const { as: Tag, ...elementProps } = props;
    return <Tag {...elementProps} {...attributes} />;
  }

  const { as: Tag = 'ul', ...elementProps } = props;
  return <Tag {...elementProps} {...attributes} />;
}

type RowLinkProps = Pick<
  ComponentPropsWithoutRef<'a'>,
  'className' | 'children' | 'aria-current' | 'aria-labelledby' | 'aria-describedby'
>;

type ListLinkAction = {
  readonly onClick?: never;
  readonly disabled?: boolean;
  readonly current?: AriaAttributes['aria-current'];
} & (
  | {
      readonly href: string;
      readonly target?: string;
      readonly rel?: string;
      readonly linkElement?: never;
    }
  | { readonly href?: never; readonly linkElement: ReactElement<RowLinkProps> }
);

type ListCommandAction = {
  readonly href?: never;
  readonly linkElement?: never;
  readonly disabled?: boolean;
  readonly onClick: MouseEventHandler<HTMLButtonElement>;
};

type ListItemProps = Omit<ComponentPropsWithRef<'li'>, 'title' | 'onClick'> & {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
  readonly action?: ListLinkAction | ListCommandAction;
  /** Pins for specimen comparisons. Real actions use native pointer and keyboard states. */
  readonly preview?: 'hover' | 'pressed' | 'focus' | undefined;
};

type ActionContent = Pick<
  ListItemProps,
  'title' | 'description' | 'leading' | 'children' | 'preview'
>;

function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== '' && typeof node !== 'boolean';
}

function ActionMain({
  action,
  title,
  description,
  leading,
  children,
  preview,
}: ActionContent & { readonly action: NonNullable<ListItemProps['action']> }): ReactElement {
  const id = useId();
  const titleId = hasContent(title) ? `${id}-title` : undefined;
  const descriptionId = hasContent(description) ? `${id}-description` : undefined;
  const attributes = {
    className: 'list-main-proto list-action-proto',
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
    'data-preview': preview,
  };
  const link = action.onClick === undefined;
  const content = (
    <>
      <span className="list-leading-proto">{leading}</span>
      <span className="list-copy-proto">
        {titleId && (
          <span id={titleId} className="list-title-proto">
            {title}
          </span>
        )}
        {descriptionId && (
          <span id={descriptionId} className="list-description-proto">
            {description}
          </span>
        )}
        {children}
      </span>
      {link && <CaretRightIcon className="list-caret-proto" aria-hidden="true" />}
    </>
  );

  if (action.onClick) {
    return (
      <button {...attributes} type="button" disabled={action.disabled} onClick={action.onClick}>
        {content}
      </button>
    );
  }

  if (action.disabled) {
    return (
      <a {...attributes} role="link" aria-disabled="true">
        {content}
      </a>
    );
  }

  if (action.linkElement) {
    return cloneElement(action.linkElement, {
      ...attributes,
      className: [attributes.className, action.linkElement.props.className]
        .filter(Boolean)
        .join(' '),
      'aria-current': action.current,
      children: content,
    });
  }

  return (
    <a
      {...attributes}
      href={action.href}
      target={action.target}
      rel={action.rel ?? (action.target === '_blank' ? 'noopener noreferrer' : undefined)}
      aria-current={action.current}
    >
      {content}
    </a>
  );
}

export function ListItem({
  title,
  description,
  leading,
  trailing,
  action,
  preview,
  className = '',
  children,
  ...props
}: ListItemProps): ReactElement {
  const rich = action !== undefined || [title, description, leading, trailing].some(hasContent);

  return (
    <li {...props} className={`list-item-proto ${className}`} data-rich={rich || undefined}>
      {!rich ? (
        children
      ) : (
        <div className="list-row-proto">
          {action ? (
            <ActionMain {...{ action, title, description, leading, children, preview }} />
          ) : (
            <div className="list-main-proto">
              <span className="list-leading-proto">{leading}</span>
              <div className="list-copy-proto">
                {hasContent(title) && <div className="list-title-proto">{title}</div>}
                {hasContent(description) && (
                  <div className="list-description-proto">{description}</div>
                )}
                {children}
              </div>
            </div>
          )}
          {hasContent(trailing) && <div className="list-trailing-proto">{trailing}</div>}
        </div>
      )}
    </li>
  );
}
