import { previewProps, previewText } from '../preview-code.js';
import type { ReactElement, ReactNode } from 'react';
import { CaretRightIcon, HouseIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Icon, Title } from '@docouno/unica';
import { PopoverContent } from '../../prototypes/popover/popover.proto.js';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../../prototypes/breadcrumb/breadcrumb.proto.js';
import '../shared/display.examples.css';
import '../../prototypes/breadcrumb/breadcrumb.examples.css';

const workspace = '?item=02-workspace-overview';
const runbooks = '?item=03-document-collection';
const failover = '?item=04-document-reader';

function Example({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div className="breadcrumb-example">
      <p className="display-example-label">{label}</p>
      {children}
    </div>
  );
}

function Sizes(): ReactElement {
  return (
    <div className="display-example-stack">
      {(
        [
          ['s', 'Small'],
          ['m', 'Medium · default'],
          ['l', 'Large'],
        ] as const
      ).map(([size, label]) => (
        <Example key={size} label={label}>
          <Breadcrumb size={size} aria-label={`${label} breadcrumb`}>
            <BreadcrumbLink href={workspace}>Platform Eng</BreadcrumbLink>
            <BreadcrumbLink href={runbooks}>Runbooks</BreadcrumbLink>
            <BreadcrumbPage>Failover guide</BreadcrumbPage>
          </Breadcrumb>
        </Example>
      ))}
    </div>
  );
}

function Anatomy(): ReactElement {
  return (
    <div className="display-example-stack">
      <Example label="Icon root and directional separator">
        <Breadcrumb
          aria-label="Runbook location"
          separator={<Icon usage="slot" icon={CaretRightIcon} directional />}
        >
          <BreadcrumbLink href={workspace} aria-label="Workspace home" iconOnly>
            <Icon usage="slot" icon={HouseIcon} />
          </BreadcrumbLink>
          <BreadcrumbLink href={runbooks}>Runbooks</BreadcrumbLink>
          <BreadcrumbPage>Failover guide</BreadcrumbPage>
        </Breadcrumb>
      </Example>
      <Example label="Static intermediate group">
        <Breadcrumb aria-label="Incident response location">
          <BreadcrumbLink href={workspace}>Platform Eng</BreadcrumbLink>
          <span>Incident response</span>
          <BreadcrumbPage>Failover guide</BreadcrumbPage>
        </Breadcrumb>
      </Example>
      <Example label="Spacing-only separator">
        <Breadcrumb aria-label="Runbooks, spacing-only" separator={null}>
          <BreadcrumbLink href={workspace}>Platform Eng</BreadcrumbLink>
          <BreadcrumbPage>Runbooks</BreadcrumbPage>
        </Breadcrumb>
      </Example>
      <Example label="Current page only">
        <Breadcrumb aria-label="Workspace location">
          <BreadcrumbPage>Platform Eng</BreadcrumbPage>
        </Breadcrumb>
      </Example>
    </div>
  );
}

function Underlines(): ReactElement {
  return (
    <div className="display-example-stack">
      <Example label="Always · default">
        <Breadcrumb aria-label="Always underline">
          <BreadcrumbLink href={workspace}>Platform Eng</BreadcrumbLink>
          <BreadcrumbLink href={runbooks}>Runbooks</BreadcrumbLink>
          <BreadcrumbPage>Failover guide</BreadcrumbPage>
        </Breadcrumb>
      </Example>
      <Example label="On hover or keyboard focus">
        <Breadcrumb aria-label="Underline on interaction" underline="hover">
          <BreadcrumbLink href={workspace}>Platform Eng</BreadcrumbLink>
          <BreadcrumbLink href={runbooks}>Runbooks</BreadcrumbLink>
          <BreadcrumbPage>Failover guide</BreadcrumbPage>
        </Breadcrumb>
      </Example>
      <Example label="No ancestor underline · current permalink">
        <Breadcrumb aria-label="Current document permalink" underline="none">
          <BreadcrumbLink href={workspace}>Platform Eng</BreadcrumbLink>
          <BreadcrumbLink href={runbooks}>Runbooks</BreadcrumbLink>
          <BreadcrumbLink href={failover} aria-current="page">
            Failover guide
          </BreadcrumbLink>
        </Breadcrumb>
      </Example>
    </div>
  );
}

function LinkStates(): ReactElement {
  return (
    <div className="display-example-stack">
      <Example label="Live · Tab, hover or press">
        <Breadcrumb aria-label="Interactive path">
          <BreadcrumbLink href={workspace} iconOnly aria-label="Workspace home">
            <Icon usage="slot" icon={HouseIcon} />
          </BreadcrumbLink>
          <BreadcrumbLink href={runbooks}>Runbooks</BreadcrumbLink>
          <BreadcrumbPage>Failover guide</BreadcrumbPage>
        </Breadcrumb>
      </Example>
      {(
        [
          { label: 'Rest' },
          { label: 'Hover', previewState: 'hover' },
          { label: 'Pressed', previewState: 'active' },
          { label: 'Keyboard focus', previewFocus: true },
          { label: 'Unavailable', disabled: true },
        ] as const
      ).map(({ label, ...state }) => (
        <Example key={label} label={label}>
          <Breadcrumb aria-label={`${label} link appearance`}>
            <BreadcrumbLink href={runbooks} {...state}>
              Runbooks
            </BreadcrumbLink>
            <BreadcrumbPage>Failover guide</BreadcrumbPage>
          </Breadcrumb>
        </Example>
      ))}
    </div>
  );
}

function Wrapping(): ReactElement {
  return (
    <div className="display-example-stack">
      <Example label="Deep path · up to 320 px">
        <div className="breadcrumb-example-narrow">
          <Breadcrumb aria-label="Deep incident response path">
            <BreadcrumbLink href={workspace}>Platform Eng</BreadcrumbLink>
            <BreadcrumbLink href={runbooks}>Runbooks</BreadcrumbLink>
            <span>Incident response</span>
            <span>Database reliability</span>
            <BreadcrumbPage>Regional failover and client connection recovery</BreadcrumbPage>
          </Breadcrumb>
        </div>
      </Example>
      <Example label="Long linked identifier and current title">
        <div className="breadcrumb-example-narrow">
          <Breadcrumb aria-label="Runbook identifier path">
            <BreadcrumbLink href={workspace}>Platform Eng</BreadcrumbLink>
            <BreadcrumbLink href={runbooks}>
              DatabaseReliabilityAndDisasterRecoveryRunbooks
            </BreadcrumbLink>
            <BreadcrumbLink href={failover} aria-current="page">
              Zero-downtime PostgreSQL failover
            </BreadcrumbLink>
          </Breadcrumb>
        </div>
      </Example>
    </div>
  );
}

function OverlayHeader(): ReactElement {
  return (
    <PopoverContent
      role="region"
      aria-label="Document details"
      className="breadcrumb-example-overlay"
    >
      <Breadcrumb size="s" underline="hover" aria-label="Document ancestors">
        <BreadcrumbLink href={workspace}>Platform Eng</BreadcrumbLink>
        <BreadcrumbLink href={runbooks}>Runbooks</BreadcrumbLink>
      </Breadcrumb>
      <Title as="h3" size="heading-s">
        Failover guide
      </Title>
    </PopoverContent>
  );
}

export default defineComponent({
  id: 'breadcrumb',
  title: 'Breadcrumb',
  category: 'Navigation',
  status: 'Proto',
  summary: 'A quiet route trail with a clear current page and room to wrap.',
  componentName: 'Breadcrumb',
  props: {
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'm',
      description: 'Typography and spacing of the trail.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    underline: {
      kind: 'enum',
      group: 'Appearance',
      default: 'always',
      description: 'When ancestor links are underlined.',
      choices: [{ value: 'always' }, { value: 'hover' }, { value: 'none' }],
    },
    separator: {
      kind: 'slot',
      group: 'Content',
      default: 'slash',
      description: 'The visual delimiter between path segments.',
      choices: [
        { value: 'slash', label: 'Slash' },
        { value: 'chevron', label: 'Chevron' },
        { value: 'none', label: 'Spacing only' },
      ],
    },
    page: {
      kind: 'string',
      group: 'Content',
      default: 'Service recovery',
      description: 'Name of the current page.',
    },
  },
  render: ({ ctx, values: { size, underline, separator, page } }) => (
    <Breadcrumb
      {...ctx.subject}
      size={size}
      underline={underline}
      separator={
        separator === 'none' ? null : separator === 'chevron' ? (
          <Icon usage="slot" icon={CaretRightIcon} directional />
        ) : (
          '/'
        )
      }
    >
      <BreadcrumbLink href={workspace}>Workspace</BreadcrumbLink>
      <BreadcrumbLink href={runbooks}>Runbooks</BreadcrumbLink>
      <BreadcrumbPage>{page}</BreadcrumbPage>
    </Breadcrumb>
  ),
  code: ({ size, underline, separator, page }) => {
    const separatorCode =
      separator === 'none'
        ? ' separator={null}'
        : separator === 'chevron'
          ? ' separator={<Icon usage="slot" icon={CaretRightIcon} directional />}'
          : '';
    return `<Breadcrumb${previewProps({ size, underline }, { size: 'm', underline: 'always' })}${separatorCode}>\n  <BreadcrumbLink href="/workspace">Workspace</BreadcrumbLink>\n  <BreadcrumbLink href="/runbooks">Runbooks</BreadcrumbLink>\n  <BreadcrumbPage>${previewText(page)}</BreadcrumbPage>\n</Breadcrumb>`;
  },
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'separator',
      title: 'Sizes',
      reference: () => <Sizes />,
    },
    {
      id: 'underlines',
      rows: 'underline',
      title: 'Link underlines',
      reference: () => <Underlines />,
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Path anatomy',
      kind: 'behavior',
      render: () => <Anatomy />,
    },
    {
      id: 'states',
      title: 'Link states',
      kind: 'behavior',
      render: () => <LinkStates />,
    },
    {
      id: 'wrapping',
      title: 'Narrow and long paths',
      kind: 'content',
      render: () => <Wrapping />,
    },
  ],
  usage: [
    {
      id: 'overlay',
      code: `<PopoverContent>
  <Breadcrumb>
    <BreadcrumbLink href="/workspace">Workspace</BreadcrumbLink>
    <BreadcrumbPage>Document settings</BreadcrumbPage>
  </Breadcrumb>
</PopoverContent>`,
      title: 'Ancestor trail above a panel title',
      surface: 'overlay',
      overlayStage: true,
      render: () => <OverlayHeader />,
    },
  ],
});
