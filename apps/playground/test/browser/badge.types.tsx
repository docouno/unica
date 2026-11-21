import { Badge, defineGlyph } from '@docouno/unica';
import type { BadgeProps, BadgeStatus } from '@docouno/unica';
import { InfoIcon } from '@phosphor-icons/react';
import { createElement, createRef } from 'react';

const status: BadgeStatus = 'success';
const props: BadgeProps = { status, size: 's', dot: true, iconLeft: InfoIcon, children: 0 };
const span = createRef<HTMLSpanElement>();
const anchor = createRef<HTMLAnchorElement>();
const button = createRef<HTMLButtonElement>();

<Badge {...props} ref={span} style={{ '--badge-max-width': '72px', marginInlineEnd: 4 }} />;
<Badge asChild ref={anchor} iconLeft={defineGlyph(InfoIcon)}>
  <a href="/release">Release</a>
</Badge>;
<Badge asChild ref={button}>
  {createElement('button', { type: 'reset' }, 'Reset')}
</Badge>;

// @ts-expect-error Native action props belong to the child.
<Badge href="/release">Release</Badge>;
// @ts-expect-error Only an element can supply the composed root.
<Badge asChild>Release</Badge>;
// @ts-expect-error Badge has no decorative material variant.
<Badge appearance="glass">Release</Badge>;
// @ts-expect-error Raw HTML cannot replace the label anatomy.
<Badge dangerouslySetInnerHTML={{ __html: 'Release' }}>Release</Badge>;
