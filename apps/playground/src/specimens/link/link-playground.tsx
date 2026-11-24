import { Link } from '@docouno/unica';
import { ArrowRightIcon, FileTextIcon } from '@phosphor-icons/react';
import type { MouseEvent, ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { guideFileName, guideLabel, guideText } from './link-code.js';
import type { LinkValues } from './link.spec.js';
import './link-matrix.css';

export function LinkPlayground({
  ctx,
  values,
}: PreviewProps & { readonly values: LinkValues }): ReactElement {
  const href = values.download
    ? 'data:text/plain;charset=utf-8,' + encodeURIComponent(guideText)
    : '?item=04-document-reader';
  const attributes = {
    ...ctx.subject,
    'data-link-comparison': ctx.tab === 'states' ? '' : undefined,
    size: values.size,
    tone: values.tone,
    underline: values.underline,
    disabled: values.disabled,
    external: values.external,
    target: values.target || undefined,
    rel: values.rel || undefined,
    download: values.download ? guideFileName : undefined,
    newTabHint: values.newTabHint || undefined,
    'aria-current': values['aria-current'] || undefined,
    iconLeft: values.iconLeft ? FileTextIcon : undefined,
    iconRight: values.iconRight ? ArrowRightIcon : undefined,
    onClick(event: MouseEvent<HTMLAnchorElement>) {
      ctx.action('onClick')(event.currentTarget.getAttribute('href'));
    },
  };
  const label = <bdi>{guideLabel(values)}</bdi>;
  let link: ReactElement;
  if (values.asChild) {
    link = (
      <Link {...attributes} asChild>
        <a href={href}>{label}</a>
      </Link>
    );
  } else if (values.disabled && !values.href) {
    link = (
      <Link {...attributes} disabled>
        {label}
      </Link>
    );
  } else {
    link = (
      <Link {...attributes} href={href}>
        {label}
      </Link>
    );
  }
  // The stage can be flex or grid. A text container preserves the anchor's inline fragments.
  return <span>{link}</span>;
}
