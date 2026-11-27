import { createRef } from 'react';
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from '../src/index.js';
import type {
  BreadcrumbLinkProps,
  BreadcrumbPageProps,
  BreadcrumbProps,
  BreadcrumbSize,
  BreadcrumbUnderline,
} from '../src/server.js';

const size: BreadcrumbSize = 'l';
const underline: BreadcrumbUnderline = 'hover';
const root: BreadcrumbProps = { size, underline, ref: createRef<HTMLElement>() };
const link: BreadcrumbLinkProps = {
  href: '/workspace',
  ref: createRef<HTMLAnchorElement>(),
  'aria-current': 'page',
};
const page: BreadcrumbPageProps = { ref: createRef<HTMLSpanElement>() };

<Breadcrumb {...root} separator={null} aria-labelledby="location">
  <BreadcrumbLink {...link}>Workspace</BreadcrumbLink>
  <BreadcrumbLink asChild>
    <a href="/runbooks">Runbooks</a>
  </BreadcrumbLink>
  <BreadcrumbLink disabled>Archive</BreadcrumbLink>
  <BreadcrumbPage {...page}>Guide</BreadcrumbPage>
</Breadcrumb>;

// @ts-expect-error An available native link requires href.
<BreadcrumbLink>Missing destination</BreadcrumbLink>;
// @ts-expect-error The slotted child owns the destination.
<BreadcrumbLink asChild href="/ignored">
  <a href="/workspace">Workspace</a>
</BreadcrumbLink>;
// @ts-expect-error The slot takes a single React element.
<BreadcrumbLink asChild>Workspace</BreadcrumbLink>;
// @ts-expect-error The library owns disabled ARIA state.
<BreadcrumbLink href="/" aria-disabled="true" />;
// @ts-expect-error The page always represents the current location.
<BreadcrumbPage aria-current="false">Guide</BreadcrumbPage>;
// @ts-expect-error Breadcrumb uses the s/m/l size scale.
<Breadcrumb size="xl" />;
// @ts-expect-error The anchor requires an anchor ref.
<BreadcrumbLink href="/" ref={createRef<HTMLButtonElement>()} />;
