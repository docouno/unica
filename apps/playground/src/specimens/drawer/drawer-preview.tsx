import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@docouno/unica';
import type { DrawerContentProps, DrawerProps } from '@docouno/unica';
import '@docouno/unica/styles.css';
import { useRef, useState } from 'react';

export function ActivityDetailsPanel({
  contentProps = {},
  rootProps = {},
  subject,
}: {
  readonly contentProps?: Pick<
    DrawerContentProps,
    'size' | 'width' | 'side' | 'dismissOnBackdrop' | 'swipeToClose'
  >;
  readonly rootProps?: Omit<DrawerProps, 'children'>;
  readonly subject?: { readonly 'data-wb-subject': '' };
} = {}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(rootProps.defaultOpen ?? false);
  const open = rootProps.open ?? uncontrolledOpen;
  return (
    <Drawer
      {...rootProps}
      onOpenChange={(next) => {
        setUncontrolledOpen(next);
        rootProps.onOpenChange?.(next);
      }}
    >
      <div className="dialog-study-launch" data-open={open || undefined}>
        <DrawerTrigger ref={triggerRef} asChild {...(!open ? subject : {})}>
          <Button variant="secondary" tone="neutral">
            View activity details
          </Button>
        </DrawerTrigger>
      </div>
      <DrawerContent
        {...(open ? subject : {})}
        {...contentProps}
        returnFocus={triggerRef}
        data-dialog-study-pinned={rootProps.open === true ? '' : undefined}
      >
        <DrawerHeader>
          <div>
            <DrawerTitle data-dialog-study-title="">Release notes</DrawerTitle>
            <DrawerDescription>QA approved version 3.</DrawerDescription>
          </div>
          <DrawerClose aria-label="Close activity details" />
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary" tone="neutral">
              Done
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
