import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import type { ControlSize } from '../../core/forms/fieldAxes.js';

export interface PaginationMessages {
  readonly previousPage: string;
  readonly nextPage: string;
  readonly pageLabel: string;
  readonly position: string;
  readonly digits: string;
}

export type PaginationLinkProps = ComponentPropsWithRef<'a'> & {
  readonly href: string;
  readonly children: ReactNode;
};

type PaginationRootProps = Omit<
  ComponentPropsWithRef<'nav'>,
  | 'aria-current'
  | 'aria-disabled'
  | 'children'
  | 'contentEditable'
  | 'dangerouslySetInnerHTML'
  | 'role'
  | 'size'
  | 'tabIndex'
> & {
  readonly pageCount: number;
  readonly size?: ControlSize | undefined;
  readonly format?: 'auto' | 'pages' | 'compact' | undefined;
  readonly messages?: Partial<PaginationMessages> | undefined;
  readonly [data: `data-${string}`]: string | number | boolean | undefined;
};

type ButtonPagination = {
  readonly onPageChange?: ((page: number) => void) | undefined;
  readonly getPageHref?: never;
  readonly renderLink?: never;
} & (
  | { readonly page?: never; readonly defaultPage?: number | undefined }
  | { readonly page: number; readonly defaultPage?: never }
);

type LinkPagination = {
  readonly page: number;
  readonly getPageHref: (page: number) => string;
  readonly renderLink?: ((props: PaginationLinkProps) => ReactElement) | undefined;
  readonly defaultPage?: never;
  readonly onPageChange?: never;
};

export type PaginationProps = PaginationRootProps & (ButtonPagination | LinkPagination);
