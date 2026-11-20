import { useLayoutEffect, useRef } from 'react';
import type { JSX } from 'react';
import {
  registerOverlay,
  resolveToastPortalHost,
  subscribeToModalChanges,
} from '../../src/core/overlay/runtime.js';
import type * as Runtime from '../../src/core/overlay/runtime.js';

export default function OverlayRealmsFixture(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current!;
    const iframe = root.querySelector('iframe')!;
    const childDocument = iframe.contentDocument!;
    const realmKeys = () =>
      Object.getOwnPropertySymbols(window).filter((key) =>
        Symbol.keyFor(key)?.startsWith('@docouno/unica'),
      );
    const registryKey = Symbol.for('@docouno/unica/OverlayRuntimeVersions');
    const registeredBefore = realmKeys().length;
    const registered = new Set<ReturnType<typeof registerOverlay>>();

    function attach(register: typeof registerOverlay, doc: Document, id: string) {
      const element = doc.body.appendChild(doc.createElement('div'));
      element.id = id;
      const button = element.appendChild(doc.createElement('button'));
      button.textContent = id;
      const handle = register({
        element,
        kind: 'manual',
        onOpenChange(open) {
          handle.setOpen(open);
          element.dataset.requests = String(Number(element.dataset.requests ?? 0) + 1);
        },
      });
      registered.add(handle);
      handle.setOpen(true);
      return element;
    }

    async function openCopies() {
      const url = new URL('../../src/core/overlay/runtime.ts', import.meta.url);
      url.searchParams.set('copy', 'second');
      const other = (await import(/* @vite-ignore */ url.href)) as typeof Runtime;
      root.dataset.distinctModules = String(other.registerOverlay !== registerOverlay);
      const versions = new Set(['earlier-version']);
      Reflect.set(window, registryKey, versions);
      const warn = console.warn;
      const warnings: string[] = [];
      console.warn = (message: string) => warnings.push(message);
      try {
        attach(registerOverlay, document, 'first-copy');
        const second = attach(other.registerOverlay, document, 'second-copy');
        attach(other.registerOverlay, childDocument, 'iframe-copy');
        second.querySelector('button')!.focus();
      } finally {
        console.warn = warn;
      }
      root.dataset.versionWarnings = String(
        warnings.filter((message) => message.includes('different package versions')).length,
      );
      root.dataset.mainRuntimeKeys = String(realmKeys().length - registeredBefore);
    }

    const shadowHost = root.querySelector<HTMLElement>('[data-shadow-host]')!;
    const shadow = shadowHost.attachShadow({ mode: 'open' });
    const modal = shadow.appendChild(document.createElement('dialog'));
    modal.textContent = 'Shadow modal';
    modal.setAttribute('aria-label', 'Shadow modal');
    const shadowLayer = registerOverlay({ element: modal, kind: 'modal', onOpenChange() {} });
    registered.add(shadowLayer);

    const checkCleanup = () => {
      const versions = Reflect.get(window, registryKey) as Set<string>;
      root.dataset.remainingVersions = [...versions].join(',');
      root.dataset.mainRuntimeKeys = String(realmKeys().length - registeredBefore);
    };
    const prepareShadow = () => {
      shadowLayer.setOpen(true);
      root.dataset.shadowProjection = String(resolveToastPortalHost(shadowHost) === modal);
    };
    const moveShadow = () => shadowHost.remove();
    const checkShadow = () => {
      root.dataset.shadowProjection = String(resolveToastPortalHost(shadowHost) === modal);
    };
    let source: HTMLDivElement | undefined;
    let destination: HTMLDivElement | undefined;
    const unsubscribe = subscribeToModalChanges(document, () => {
      root.dataset.modalHost = resolveToastPortalHost(document.body)?.id || 'body';
      if (source && destination) {
        root.dataset.scopedHosts = [source, destination]
          .map((scope) => resolveToastPortalHost(scope)?.id || 'none')
          .join('|');
      }
    });
    const moveOwnedDialog = () => {
      source = root.appendChild(document.createElement('div'));
      source.id = 'origin';
      destination = root.appendChild(document.createElement('div'));
      destination.id = 'destination';
      const dialog = source.appendChild(document.createElement('dialog'));
      dialog.id = 'moved-dialog';
      dialog.style.cssText = 'width:0;height:0;box-sizing:border-box;padding:0;border:0';
      const handle = registerOverlay({ element: dialog, kind: 'modal', onOpenChange() {} });
      registered.add(handle);
      handle.setOpen(true);
      root.dataset.hostsBeforeMove = root.dataset.scopedHosts;
      destination.moveBefore(dialog, null);
      root.dataset.preservedModal = String(
        dialog.matches(':modal') && dialog.getBoundingClientRect().height === 0,
      );
    };
    let slottedDialog: HTMLDialogElement | undefined;
    let secondSlot: HTMLSlotElement | undefined;
    const openForLateShadow = () => {
      source = root.appendChild(document.createElement('div'));
      source.id = 'late-host';
      destination = root.appendChild(document.createElement('div'));
      destination.id = 'late-scope';
      const dialog = source.appendChild(document.createElement('dialog'));
      dialog.id = 'late-dialog';
      const handle = registerOverlay({ element: dialog, kind: 'modal', onOpenChange() {} });
      registered.add(handle);
      handle.setOpen(true);
    };
    const attachShadowScope = () => {
      const shadow = source!.attachShadow({ mode: 'open' });
      shadow.moveBefore(destination!, null);
    };
    const openSlottedDialog = () => {
      const host = root.appendChild(document.createElement('div'));
      const shadow = host.attachShadow({ mode: 'open' });
      source = shadow.appendChild(document.createElement('div'));
      source.id = 'slot-origin';
      source.appendChild(document.createElement('slot')).name = 'first';
      destination = shadow.appendChild(document.createElement('div'));
      destination.id = 'slot-destination';
      secondSlot = destination.appendChild(document.createElement('slot'));
      secondSlot.name = 'second';
      slottedDialog = host.appendChild(document.createElement('dialog'));
      slottedDialog.id = 'slotted-dialog';
      slottedDialog.slot = 'first';
      const handle = registerOverlay({ element: slottedDialog, kind: 'modal', onOpenChange() {} });
      registered.add(handle);
      handle.setOpen(true);
    };
    const adoptPopover = () => {
      const element = root.appendChild(document.createElement('div'));
      element.id = 'adopted';
      const button = element.appendChild(document.createElement('button'));
      button.textContent = 'Adopted action';
      const oldOwner = registerOverlay({
        element,
        kind: 'manual',
        onOpenChange(_open, reason) {
          root.dataset.oldOwnerDismiss = reason;
        },
      });
      registered.add(oldOwner);
      oldOwner.setOpen(true);
      childDocument.body.appendChild(element);
      const newOwner = registerOverlay({
        element,
        kind: 'manual',
        onOpenChange(open, reason) {
          root.dataset.newOwnerDismiss = reason;
          newOwner.setOpen(open);
        },
      });
      registered.add(newOwner);
      newOwner.setOpen(true);
    };
    const start = () => {
      openCopies().catch((error: unknown) => window.reportError(error));
    };
    root.addEventListener('open-copies', start);
    root.addEventListener('check-cleanup', checkCleanup);
    root.addEventListener('open-shadow', prepareShadow);
    root.addEventListener('remove-shadow', moveShadow);
    root.addEventListener('check-shadow', checkShadow);
    root.addEventListener('move-owned-dialog', moveOwnedDialog);
    root.addEventListener('remove-moved-dialog', () => destination?.remove());
    root.addEventListener('adopt-popover', adoptPopover);
    root.addEventListener('open-slotted-dialog', openSlottedDialog);
    root.addEventListener('open-for-late-shadow', openForLateShadow);
    root.addEventListener('attach-shadow-scope', attachShadowScope);
    root.addEventListener('add-default-slot', () => {
      destination!.appendChild(document.createElement('slot'));
    });
    root.addEventListener('reassign-dialog-slot', () => {
      slottedDialog!.slot = 'second';
    });
    root.addEventListener('rename-dialog-slot', () => {
      const slot = secondSlot!;
      slot.name = slot.name === 'second' ? 'unused' : 'second';
    });
    return () => {
      unsubscribe();
      registered.forEach((handle) => handle.dispose());
      Reflect.deleteProperty(window, registryKey);
    };
  }, []);

  return (
    <div ref={ref} id="overlay-realms">
      <iframe title="Independent document" />
      <div data-shadow-host="" />
    </div>
  );
}
