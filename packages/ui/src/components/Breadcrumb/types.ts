import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { SIZE } from '../../consts.js';
import type { AnchorDestination, AnchorProps } from '../../core/anchor.js';
import type { ExactAxisSubset } from '../../types.js';
import type { LinkUnderline } from '../Link/types.js';
import type { BREADCRUMB_SIZE } from './consts.js';

export type BreadcrumbSize = ExactAxisSubset<
  typeof SIZE,
  typeof BREADCRUMB_SIZE
>[keyof typeof BREADCRUMB_SIZE];

export type BreadcrumbUnderline = LinkUnderline;

export interface BreadcrumbProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'dangerouslySetInnerHTML'
> {
  readonly size?: BreadcrumbSize | undefined;
  readonly underline?: BreadcrumbUnderline | undefined;
  readonly separator?: ReactNode;
  readonly dangerouslySetInnerHTML?: never;
}

type LinkOwnedAttribute = 'aria-disabled' | 'dangerouslySetInnerHTML';

export type BreadcrumbLinkProps = AnchorDestination &
  Omit<AnchorProps, 'href' | 'children' | LinkOwnedAttribute> & {
    readonly underline?: BreadcrumbUnderline | undefined;
    readonly iconOnly?: boolean | undefined;
    readonly 'aria-disabled'?: never;
    readonly dangerouslySetInnerHTML?: never;
  };

export type BreadcrumbPageProps = Omit<ComponentPropsWithRef<'span'>, 'aria-current'> & {
  readonly 'aria-current'?: never;
};
