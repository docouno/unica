import { Icon, IconProvider, UnicaProvider, defineGlyph } from '@docouno/unica';
import type { IconAdapter } from '@docouno/unica';
import { ArrowRightIcon, BellIcon, CheckIcon, IconContext } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import type { ComponentPropsWithRef } from 'react';
import {
  DocumentTabs,
  LeftRail,
  WorkspaceNavigation,
  WorkspaceTrash,
} from '../../../src/prototypes/app-shell/app-shell.proto.js';
import { Avatar } from '../../../src/prototypes/avatar/avatar.proto.js';
import { FileItem, FileList } from '../../../src/prototypes/file-input/file-input.proto.js';
import { Combobox } from '../../../src/prototypes/combobox/combobox.proto.js';
import { MenuRows, MenuSurface } from '../../../src/prototypes/menu/menu.proto.js';
import { Select } from '../../../src/prototypes/select/select.proto.js';
import { Switch } from '../../../src/prototypes/binary-controls/binary-controls.proto.js';
import { Button } from '../../../src/prototypes/button/button.proto.js';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '../../../src/prototypes/dialog/dialog.proto.js';
import { Empty, EmptyMedia } from '../../../src/prototypes/empty/empty.proto.js';
import { Input } from '../../../src/prototypes/input/input.proto.js';
import { Link } from '../../../src/prototypes/link/link.proto.js';
import { Tabs, TabsList, TabsTab } from '../../../src/prototypes/tabs/tabs.proto.js';

function ProjectSvg({ children, ...props }: ComponentPropsWithRef<'svg'>) {
  const clip = useId();
  return (
    <svg {...props} viewBox="0 0 32 16">
      {children}
      <defs>
        <clipPath id={clip}>
          <rect width="24" height="16" />
        </clipPath>
      </defs>
      <rect data-drawing="" width="32" height="16" fill="currentColor" clipPath={`url(#${clip})`} />
      <rect x="2" y="2" width="4" height="4" fill="rgb(20, 100, 45)" />
    </svg>
  );
}

const mark = defineGlyph(ProjectSvg);
const replacement: IconAdapter = (_source, { svgProps, usage }) => (
  <ProjectSvg {...svgProps} data-replacement={usage} />
);
const vendor = {
  weight: 'fill',
  color: 'red',
  fill: 'red',
  size: 64,
  mirrored: true,
  role: 'presentation',
  'aria-hidden': true,
  'aria-label': 'Foreign label',
  'aria-labelledby': 'missing',
  tabIndex: 0,
  focusable: true,
} as const;

export default function IconFixture() {
  const [bold, setBold] = useState(false);
  const [hideFirst, setHideFirst] = useState(false);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [swap, setSwap] = useState(false);
  const buildStatus = 'ready';
  const slotAttributes = { tabindex: 0, 'data-testid': 'html-attributes' };
  return (
    <>
      <section data-testid="measurements" style={{ width: 560 }}>
        <UnicaProvider overrides={{ Icon: { size: 's' } }}>
          <span data-testid="text">
            <Icon icon={ArrowRightIcon} data-testid="standalone" />
            <Icon
              icon={ArrowRightIcon}
              data-testid="inline"
              usage="slot"
              style={{ fontSize: 40, font: '40px serif' }}
            />{' '}
            Inline text
          </span>
          <Link href="#target" external data-testid="external">
            External reference
          </Link>
          <Empty>
            <EmptyMedia icon={BellIcon} data-testid="media" />
          </Empty>
          <Button size="m" iconLeft={ArrowRightIcon} data-testid="themed-button">
            Continue
          </Button>
          <Button size="m" iconLeft={ArrowRightIcon} data-testid="disabled-button" disabled>
            Unavailable
          </Button>
          <Input aria-label="Disabled input" disabled iconLeft={BellIcon} />
        </UnicaProvider>
        <div style={{ '--size-m-icon': '24px' } as React.CSSProperties}>
          <Icon icon={mark} size="m" data-testid="wide" />
        </div>
      </section>

      <section data-testid="accessible">
        <button type="button">Before icons</button>
        <span id="test-icon-name">Linked name</span>
        <Icon icon={mark} aria-labelledby="test-icon-name" aria-label="Fallback">
          <title>Title loses</title>
        </Icon>
        <Icon icon={mark} aria-labelledby="unresolved" aria-label="Fallback name" />
        <Icon icon={ArrowRightIcon}>
          <title>Arrow title</title>
        </Icon>
        <Icon icon={mark} aria-labelledby="build-title" aria-label="Fallback">
          <title id="build-title">Build {buildStatus}</title>
        </Icon>
        <Icon usage="slot" icon={mark} {...slotAttributes} />
        <Icon icon={ArrowRightIcon} data-testid="decorative" aria-label="   " />
        <Button iconLeft={ArrowRightIcon}>After icons</Button>
      </section>

      <div hidden>
        {(['regular', 'fill', 'bold'] as const).map((weight) => (
          <ArrowRightIcon key={weight} weight={weight} data-testid={`reference-${weight}`} />
        ))}
      </div>
      <IconContext value={vendor}>
        <section data-testid="vendor" style={{ color: 'rgb(21, 77, 133)' }}>
          <button type="button" onClick={() => setBold(!bold)}>
            Toggle weight
          </button>
          <Icon
            icon={ArrowRightIcon}
            weight={bold ? 'bold' : undefined}
            data-testid="weight"
            aria-label="Owner label"
            size="m"
            ref={(node) => node?.setAttribute('data-owner-ref', '')}
            style={{
              all: 'unset',
              width: 99,
              height: 99,
              inlineSize: 99,
              maxBlockSize: 2,
              color: 'red',
              fill: 'blue',
            }}
          />
          <Icon icon={ArrowRightIcon} usage="slot" size="m" data-testid="slot-weight" />
          <Icon icon={ArrowRightIcon} directional mirrored size="m" data-testid="logical" />
          <Icon icon={ArrowRightIcon} mirrored size="m" data-testid="physical" />
          <Icon icon={CheckIcon} size="m" data-testid="check" />
          <span dir="rtl">
            <span dir="ltr">
              <Icon icon={ArrowRightIcon} directional data-testid="nested-ltr" />
            </span>
            <bdi>
              English <Icon icon={ArrowRightIcon} directional data-testid="auto-ltr" />
            </bdi>
          </span>
          <span dir="auto">
            مرحبا <Icon icon={ArrowRightIcon} directional data-testid="auto-rtl" />
          </span>
          <button type="button">After vendor icons</button>
        </section>
      </IconContext>

      <section data-testid="svgs">
        <button type="button" onClick={() => setHideFirst(true)}>
          Remove first icon
        </button>
        {!hideFirst && <Icon icon={mark} size="l" data-testid="first-project" />}
        <Icon icon={mark} size="l" data-testid="second-project" />
      </section>

      <section data-testid="hosts">
        <button type="button" onClick={() => setSwap(!swap)}>
          Toggle adapter
        </button>
        <IconProvider adapter={swap ? replacement : 'phosphor'}>
          <Button iconLeft={BellIcon} data-testid="application">
            Application button
          </Button>
          <Modal open={modal} onOpenChange={setModal}>
            <ModalTrigger>Open modal</ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Example modal</ModalTitle>
              </ModalHeader>
            </ModalContent>
          </Modal>
          <Drawer open={drawer} onOpenChange={setDrawer}>
            <DrawerTrigger>Open drawer</DrawerTrigger>
            <DrawerContent side="end">
              <DrawerHeader>
                <DrawerTitle>Example drawer</DrawerTitle>
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
          {(['s', 'm', 'l'] as const).map((size) => (
            <Switch key={size} size={size} label={`Switch ${size}`} thumbIcon={BellIcon} />
          ))}
        </IconProvider>
      </section>

      <section data-testid="chrome">
        <WorkspaceNavigation />
        <WorkspaceTrash />
        <MenuSurface>
          <MenuRows
            items={[{ type: 'branch', id: 'submenu', label: 'Default side', items: [] }]}
            activeBranch="submenu"
          />
          <MenuRows
            items={[{ type: 'branch', id: 'submenu', label: 'Flipped side', items: [] }]}
            activeBranch="submenu"
            flipped
          />
        </MenuSurface>
        <IconProvider adapter={replacement}>
          <Select options={[]} label="Invalid selection" size="l" status="danger" />
          <Combobox options={[]} label="Lookup" searchState="error" previewOpen />
        </IconProvider>
        <IconProvider adapter={() => null}>
          <DocumentTabs />
          <LeftRail showBrand />
          <WorkspaceNavigation kind="admin" />
          <Avatar alt="Unassigned user" />
          <FileList>
            <FileItem name="Readme" />
          </FileList>
        </IconProvider>
      </section>

      <Tabs defaultValue="one" orientation="vertical">
        <TabsList>
          <TabsTab value="one" iconLeft={BellIcon} count={12}>
            With icon
          </TabsTab>
          <TabsTab value="two">Without icon</TabsTab>
          <TabsTab value="three" iconLeft={BellIcon} aria-label="Icon only" />
        </TabsList>
      </Tabs>
    </>
  );
}
