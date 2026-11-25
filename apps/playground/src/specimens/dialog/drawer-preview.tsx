import { useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../../prototypes/dialog/dialog.proto.js';
import '@docouno/unica/styles.css';

export function ActivityFilterPanel({
  contentProps = {},
  subject = {},
  pinned = false,
  onOpenChange = (open = false) => console.log(open),
} = {}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        display: 'grid',
        placeItems: 'center',
        inlineSize: '100%',
        blockSize: 320,
      }}
    >
      <Drawer
        open={pinned || open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange(next);
        }}
      >
        {!pinned && (
          <div inert={open} style={{ visibility: open ? 'hidden' : 'visible' }}>
            <DrawerTrigger {...(!open ? subject : {})} variant="secondary">
              Filter activity
            </DrawerTrigger>
          </div>
        )}
        <DrawerContent {...subject} {...contentProps} inactive={pinned} described>
          <DrawerHeader>
            <DrawerTitle>Activity filters</DrawerTitle>
            <DrawerDescription>Actor and action filters.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Done</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
