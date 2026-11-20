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
    const realmKeys = (doc: Document = document) =>
      Object.getOwnPropertySymbols(doc).filter((key) =>
        Symbol.keyFor(key)?.startsWith('@docouno/unica'),
      );
    const registryKey = Symbol.for('@docouno/unica/OverlayRuntimeVersions');
    const registeredBefore = realmKeys(document).length;
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
      Reflect.set(document, registryKey, versions);
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
      root.dataset.mainRuntimeKeys = String(realmKeys(document).length - registeredBefore);
    }

    const shadowHost = root.querySelector<HTMLElement>('[data-shadow-host]')!;
    const shadow = shadowHost.attachShadow({ mode: 'open' });
    const modal = shadow.appendChild(document.createElement('dialog'));
    modal.textContent = 'Shadow modal';
    modal.setAttribute('aria-label', 'Shadow modal');
    const shadowLayer = registerOverlay({ element: modal, kind: 'modal', onOpenChange() {} });
    registered.add(shadowLayer);

    const checkCleanup = () => {
      const versions = Reflect.get(document, registryKey) as Set<string>;
      root.dataset.remainingVersions = [...versions].join(',');
      root.dataset.mainRuntimeKeys = String(realmKeys(document).length - registeredBefore);
    };
    const prepareShadow = () => {
      shadowLayer.setOpen(true);
      root.dataset.shadowProjection = String(resolveToastPortalHost(shadowHost) === modal);
    };
    const moveShadow = () => shadowHost.remove();
    const checkShadow = () => {
      root.dataset.shadowProjection = String(resolveToastPortalHost(shadowHost) === modal);
    };

    const unsubscribe = subscribeToModalChanges(document, () => {
      root.dataset.modalHost = resolveToastPortalHost(document.body)?.id || 'body';
    });

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

    let iframeModalHandle: ReturnType<typeof registerOverlay> | undefined;
    const openIframeModal = () => {
      const spacer = childDocument.body.appendChild(childDocument.createElement('div'));
      spacer.style.height = '2000px';
      iframe.contentWindow!.scrollTo(0, 300);
      const dialog = childDocument.body.appendChild(childDocument.createElement('dialog'));
      iframeModalHandle = registerOverlay({ element: dialog, kind: 'modal', onOpenChange() {} });
      registered.add(iframeModalHandle);
      iframeModalHandle.setOpen(true);
    };
    const navigateAndDisposeIframe = () => {
      iframe.addEventListener(
        'load',
        () => {
          const newDoc = iframe.contentDocument!;
          const tall = newDoc.body.appendChild(newDoc.createElement('div'));
          tall.style.height = '2000px';
          iframe.contentWindow!.scrollTo(0, 450);
          iframeModalHandle?.dispose();
          root.dataset.iframeDisposedCleanly = String(iframe.contentWindow!.scrollY === 450);
        },
        { once: true },
      );
      iframe.src = 'about:blank';
    };

    const start = () => {
      openCopies().catch((error: unknown) => window.reportError(error));
    };
    root.addEventListener('open-copies', start);
    root.addEventListener('check-cleanup', checkCleanup);
    root.addEventListener('open-shadow', prepareShadow);
    root.addEventListener('remove-shadow', moveShadow);
    root.addEventListener('check-shadow', checkShadow);
    root.addEventListener('adopt-popover', adoptPopover);
    root.addEventListener('open-iframe-modal', openIframeModal);
    root.addEventListener('navigate-dispose-iframe', navigateAndDisposeIframe);

    return () => {
      unsubscribe();
      registered.forEach((handle) => handle.dispose());
      Reflect.deleteProperty(document, registryKey);
    };
  }, []);

  return (
    <div ref={ref} id="overlay-realms">
      <iframe title="Independent document" />
      <div data-shadow-host="" />
    </div>
  );
}
