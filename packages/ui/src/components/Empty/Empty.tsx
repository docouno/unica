import { Children, Fragment, createContext, isValidElement, use } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from '../../core/cx.js';
import { Icon } from '../Icon/index.js';
import { Text } from '../Text/index.js';
import type { TextSize } from '../Text/index.js';
import { Title } from '../Title/index.js';
import type { TitleSize } from '../Title/index.js';
import type {
  EmptyActionsProps,
  EmptyDescriptionProps,
  EmptyMediaProps,
  EmptyProps,
  EmptySize,
  EmptyTitleProps,
} from './types.js';
import './empty.css';

const SizeContext = createContext<EmptySize>('m');
const typography: Readonly<Record<EmptySize, { title: TitleSize; description: TextSize }>> = {
  s: { title: 'heading-s', description: 'body-s' },
  m: { title: 'heading-m', description: 'body-s' },
  l: { title: 'heading-xl', description: 'body-m' },
};

function hasContent(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (typeof child === 'string') {
      return child.trim().length > 0;
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return hasContent(child.props.children);
    }
    return true;
  });
}

/** Lays out a resolved empty state on the surrounding surface. */
export function Empty({
  size = 'm',
  align = 'center',
  children,
  className,
  ...nativeProps
}: EmptyProps): ReactElement {
  return (
    <div
      {...nativeProps}
      className={cx('unica-empty', className)}
      data-unica-empty-size={size}
      data-unica-empty-align={align}
    >
      <SizeContext value={size}>{children}</SizeContext>
    </div>
  );
}

/** Shows an illustration or a decorative glyph on a themed medallion. */
export function EmptyMedia({
  icon,
  color = 'muted',
  children,
  className,
  ...nativeProps
}: EmptyMediaProps): ReactElement | null {
  const illustration = hasContent(children);
  if (!illustration && !icon) {
    return null;
  }

  return (
    <div
      {...nativeProps}
      className={cx('unica-empty-media', className)}
      data-unica-empty-media={illustration ? 'illustration' : 'medallion'}
      data-unica-empty-color={illustration ? undefined : color}
      aria-hidden={illustration ? nativeProps['aria-hidden'] : true}
    >
      {illustration ? children : icon && <Icon usage="slot" icon={icon} />}
    </div>
  );
}

/** Renders the empty state's native heading at the composition's visual size. */
export function EmptyTitle({
  as = 'h3',
  children,
  className,
  ...nativeProps
}: EmptyTitleProps): ReactElement | null {
  const size = use(SizeContext);
  if (!hasContent(children)) {
    return null;
  }

  return (
    <Title
      {...nativeProps}
      as={as}
      size={typography[size].title}
      weight="semibold"
      color={undefined}
      textWrap="balance"
      className={cx('unica-empty-title', className)}
    >
      {children}
    </Title>
  );
}

/** Explains why the surrounding region is empty in a native paragraph. */
export function EmptyDescription({
  children,
  className,
  ...nativeProps
}: EmptyDescriptionProps): ReactElement | null {
  const size = use(SizeContext);
  if (!hasContent(children)) {
    return null;
  }

  return (
    <Text
      {...nativeProps}
      as="p"
      size={typography[size].description}
      weight="regular"
      color={undefined}
      className={cx('unica-empty-description', className)}
    >
      {children}
    </Text>
  );
}

/** Arranges recovery actions in reading order and wraps them as needed. */
export function EmptyActions({
  children,
  className,
  ...nativeProps
}: EmptyActionsProps): ReactElement | null {
  if (!hasContent(children)) {
    return null;
  }

  return (
    <div {...nativeProps} className={cx('unica-empty-actions', className)}>
      {children}
    </div>
  );
}
