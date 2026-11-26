import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Input,
} from '@docouno/unica';
import type { DrawerSide } from '@docouno/unica';
import { useState } from 'react';
import type { JSX } from 'react';

const adaptiveSide = { narrow: 'bottom', wide: 'end' } as const;

export default function DialogGeometryFixture(): JSX.Element {
  const [side, setSide] = useState<DrawerSide | typeof adaptiveSide>(adaptiveSide);
  const [open, setOpen] = useState(false);
  const [allow, setAllow] = useState(false);
  const [swipe, setSwipe] = useState(true);
  const [short, setShort] = useState(false);
  const [closes, setCloses] = useState(0);
  const [submits, setSubmits] = useState(0);
  return (
    <>
      <div hidden>
        <button type="button" id="side-start" onClick={() => setSide('start')} />
        <button type="button" id="side-top" onClick={() => setSide('top')} />
        <button type="button" id="swipe-off" onClick={() => setSwipe(false)} />
        <button type="button" id="allow-close" onClick={() => setAllow(true)} />
        <button type="button" id="short-form" onClick={() => setShort(true)} />
      </div>
      <output id="drawer-close-requests">{closes}</output>
      <output id="drawer-form-submits">{submits}</output>
      <Drawer
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            setCloses((count) => count + 1);
          }
          if (value || allow) {
            setOpen(value);
          }
        }}
      >
        <DrawerTrigger>Open geometry drawer</DrawerTrigger>
        <DrawerContent id="geometry-drawer" side={side} width="s" swipeToClose={swipe}>
          <DrawerHeader>
            <div>
              <DrawerTitle>Drawer layout</DrawerTitle>
              <DrawerDescription>Resize while editing.</DrawerDescription>
            </div>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>
            <form
              id="drawer-form"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmits((count) => count + 1);
              }}
            >
              {short ? (
                <span>Short content</span>
              ) : (
                <>
                  <div aria-hidden="true" style={{ blockSize: 100 }} />
                  <Input name="draft" aria-label="Drawer draft" defaultValue="Resize draft" />
                  <div aria-hidden="true" style={{ blockSize: 560 }} />
                </>
              )}
            </form>
          </DrawerBody>
          <DrawerFooter>
            <Button type="submit" form="drawer-form">
              Save drawer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
