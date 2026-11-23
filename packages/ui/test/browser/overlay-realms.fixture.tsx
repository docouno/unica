import { useLayoutEffect, useRef } from 'react';
import type { JSX } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '../../src/index.js';
import { getLiveView, isInertElement } from '../../src/core/dom.js';
import { OVERLAY_RUNTIME_KEY } from '../../src/core/overlay-protocol.js';
import { focusElement, lockDocumentScroll } from '../../src/core/overlay/dom.js';
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
      const oldDoc = iframe.contentDocument!;
      iframe.addEventListener(
        'load',
        () => {
          const newDoc = iframe.contentDocument!;
          const tall = newDoc.body.appendChild(newDoc.createElement('div'));
          tall.style.height = '2000px';
          iframe.contentWindow!.scrollTo(0, 450);
          iframeModalHandle?.dispose();
          root.dataset.iframeDisposedCleanly = String(
            iframe.contentWindow!.scrollY === 450 &&
              getLiveView(oldDoc) === null &&
              getLiveView(newDoc) === iframe.contentWindow,
          );
        },
        { once: true },
      );
      iframe.src = 'about:blank';
    };

    const disposePopoverAfterNavigation = () => {
      const host = childDocument.body.appendChild(childDocument.createElement('div'));
      const child = createRoot(host);
      flushSync(() => {
        child.render(
          <Popover>
            <PopoverTrigger>Open stale panel</PopoverTrigger>
            <PopoverContent id="stale-panel" aria-label="Stale panel">
              <PopoverClose />
            </PopoverContent>
          </Popover>,
        );
      });
      const mounted = host.querySelector('[aria-controls="stale-panel"][aria-expanded="false"]');
      iframe.addEventListener(
        'load',
        () => {
          child.unmount();
          root.dataset.stalePopoverDisposed = String(
            mounted !== null &&
              getLiveView(childDocument) === null &&
              host.childElementCount === 0 &&
              realmKeys(childDocument).length === 0,
          );
        },
        { once: true },
      );
      iframe.sandbox.value = '';
      iframe.srcdoc = '<p>New document</p>';
    };

    const checkCrossDocTrigger = () => {
      const host = root.appendChild(document.createElement('div'));
      const cleanForeignButton = childDocument.body.appendChild(
        childDocument.createElement('button'),
      );
      cleanForeignButton.type = 'button';
      const ownPopover = childDocument.body.appendChild(childDocument.createElement('div'));
      ownPopover.id = 'child-own-popover';
      ownPopover.popover = 'auto';
      const boundForeignButton = childDocument.body.appendChild(
        childDocument.createElement('button'),
      );
      boundForeignButton.type = 'button';
      boundForeignButton.popoverTargetElement = ownPopover;

      const handle = registerOverlay({
        kind: 'auto',
        element: host,
        trigger: cleanForeignButton,
        onOpenChange() {},
      });
      registered.add(handle);
      handle.setOpen(true);
      handle.beginExit();
      const cleanMutated = cleanForeignButton.hasAttribute('popovertarget');

      handle.setTrigger(boundForeignButton);
      handle.setOpen(true);
      handle.beginExit();
      const boundPreservedWhileActive = boundForeignButton.popoverTargetElement === ownPopover;
      handle.dispose();
      const boundPreservedAfterDispose = boundForeignButton.popoverTargetElement === ownPopover;
      root.dataset.foreignTriggerMutated = String(
        cleanMutated || !boundPreservedWhileActive || !boundPreservedAfterDispose,
      );
    };

    const checkProtocolJoinWarning = async () => {
      const url = new URL('../../src/core/overlay/runtime.ts', import.meta.url);
      url.searchParams.set('copy', 'third');
      const third = (await import(/* @vite-ignore */ url.href)) as typeof Runtime;
      const warn = console.warn;
      const warnings: string[] = [];
      console.warn = (message: string) => warnings.push(message);
      try {
        attach(registerOverlay, document, 'join-first');
        // Simulate an already-active runtime created by a different package version on protocol 1.
        Reflect.set(document, registryKey, new Set(['0.0.9']));
        attach(third.registerOverlay, document, 'join-second');
      } finally {
        console.warn = warn;
      }
      root.dataset.joinVersionWarnings = String(
        warnings.filter((message) => message.includes('different package versions')).length,
      );
    };

    const checkMoveBeforeModal = () => {
      const containerA = root.appendChild(document.createElement('div'));
      const containerB = root.appendChild(document.createElement('div'));
      const wrapper = containerA.appendChild(document.createElement('div'));
      const dialog = wrapper.appendChild(document.createElement('dialog'));
      const handle = registerOverlay({ kind: 'modal', element: dialog, onOpenChange() {} });
      registered.add(handle);
      handle.setOpen(true);
      const movable = containerB as HTMLElement & {
        moveBefore?: (node: Node, child: Node | null) => void;
      };
      if (typeof movable.moveBefore === 'function') {
        movable.moveBefore(wrapper, null);
        // After a microtask let onMutations re-watch containerB, verify lock held, then remove containerB.
        queueMicrotask(() => {
          const stillLocked =
            dialog.matches(':modal') && document.documentElement.style.overflow === 'hidden';
          containerB.remove();
          queueMicrotask(() => {
            root.dataset.moveBeforeReleased = String(
              stillLocked && document.documentElement.style.overflow === '',
            );
          });
        });
      } else {
        handle.dispose();
        root.dataset.moveBeforeReleased = 'unsupported';
      }
    };

    const checkCrossBundleTriggers = async () => {
      const url = new URL('../../src/core/overlay/runtime.ts', import.meta.url);
      url.searchParams.set('copy', 'trigger-copy-b');
      const copyB = (await import(/* @vite-ignore */ url.href)) as typeof Runtime;

      const results: Record<string, unknown> = {};
      for (const order of ['A-then-B', 'B-then-A'] as const) {
        const host = root.appendChild(document.createElement('div'));
        const outerTrigger = host.appendChild(document.createElement('div'));
        outerTrigger.id = `outer-trig-${order}`;
        const innerTrigger = outerTrigger.appendChild(document.createElement('div'));
        innerTrigger.id = `inner-trig-${order}`;
        const outerPopover = host.appendChild(document.createElement('div'));
        const innerPopover = host.appendChild(document.createElement('div'));

        let outerCalls = 0;
        let innerCalls = 0;
        const handleA = registerOverlay({
          kind: 'auto',
          element: outerPopover,
          trigger: outerTrigger,
          onOpenChange(open) {
            outerCalls++;
            handleA.setOpen(open);
          },
        });
        const handleB = copyB.registerOverlay({
          kind: 'auto',
          element: innerPopover,
          trigger: innerTrigger,
          onOpenChange(open) {
            innerCalls++;
            handleB.setOpen(open);
          },
        });

        innerTrigger.click();
        const afterInnerClick = {
          outerCalls,
          innerCalls,
          outerOpen: outerPopover.matches(':popover-open'),
          innerOpen: innerPopover.matches(':popover-open'),
        };

        // Close via second click on innerTrigger (1 click -> 1 toggle).
        innerTrigger.click();
        const afterSecondClick = {
          outerCalls,
          innerCalls,
          innerOpen: innerPopover.matches(':popover-open'),
        };

        if (order === 'A-then-B') {
          handleA.dispose();
          handleB.dispose();
        } else {
          handleB.dispose();
          handleA.dispose();
        }
        host.remove();
        results[order] = {
          afterInnerClick,
          afterSecondClick,
          keysAfterTeardown: realmKeys(document).length - registeredBefore,
        };
      }

      // Remount after full teardown + independent iframe trigger must work cleanly and leave 0 keys.
      const remountHost = root.appendChild(document.createElement('div'));
      const remountTrigger = remountHost.appendChild(document.createElement('div'));
      const remountPopover = remountHost.appendChild(document.createElement('div'));
      let remountCalls = 0;
      const remountHandle = copyB.registerOverlay({
        kind: 'auto',
        element: remountPopover,
        trigger: remountTrigger,
        onOpenChange(open) {
          remountCalls++;
          remountHandle.setOpen(open);
        },
      });
      const iframeTrigger = childDocument.body.appendChild(childDocument.createElement('div'));
      const iframePopover = childDocument.body.appendChild(childDocument.createElement('div'));
      let iframeCalls = 0;
      const iframeHandle = registerOverlay({
        kind: 'auto',
        element: iframePopover,
        trigger: iframeTrigger,
        onOpenChange(open) {
          iframeCalls++;
          iframeHandle.setOpen(open);
        },
      });
      remountTrigger.click();
      iframeTrigger.click();
      results.remountAndIframe = {
        remountCalls,
        remountOpen: remountPopover.matches(':popover-open'),
        iframeCalls,
        iframeOpen: iframePopover.matches(':popover-open'),
      };
      remountHandle.dispose();
      iframeHandle.dispose();
      remountHost.remove();
      iframeTrigger.remove();
      iframePopover.remove();
      results.finalMainKeys = realmKeys(document).length - registeredBefore;
      results.finalIframeKeys = realmKeys(childDocument).length;
      root.dataset.crossBundleTriggers = JSON.stringify(results);
    };

    const checkInertAndFocusMatrix = () => {
      const box = root.appendChild(document.createElement('div'));
      const bgInput = box.appendChild(document.createElement('input'));

      // 1. Mixed modal order: Unica -> foreign on top
      const unicaD1 = box.appendChild(document.createElement('dialog'));
      const unicaIn1 = unicaD1.appendChild(document.createElement('input'));
      const foreignD1 = box.appendChild(document.createElement('dialog'));
      const foreignIn1 = foreignD1.appendChild(document.createElement('input'));
      const h1 = registerOverlay({ kind: 'modal', element: unicaD1, onOpenChange() {} });
      h1.setOpen(true);
      foreignD1.showModal();
      const unicaThenForeign = {
        foreignInert: isInertElement(foreignIn1),
        foreignFocus: focusElement(foreignIn1, document),
        unicaFocus: focusElement(unicaIn1, document),
        bgInert: isInertElement(bgInput),
      };
      foreignD1.close();
      h1.dispose();

      // 2. Mixed modal order: foreign -> Unica on top
      const foreignD2 = box.appendChild(document.createElement('dialog'));
      const foreignIn2 = foreignD2.appendChild(document.createElement('input'));
      const unicaD2 = box.appendChild(document.createElement('dialog'));
      const unicaIn2 = unicaD2.appendChild(document.createElement('input'));
      foreignD2.showModal();
      const h2 = registerOverlay({ kind: 'modal', element: unicaD2, onOpenChange() {} });
      h2.setOpen(true);
      const foreignThenUnica = {
        unicaInert: isInertElement(unicaIn2),
        unicaFocus: focusElement(unicaIn2, document),
        foreignFocus: focusElement(foreignIn2, document),
        bgInert: isInertElement(bgInput),
      };
      h2.dispose();
      foreignD2.close();

      // 3. Reverse DOM order two Unica modals (A before B in DOM; open B then A) on primary & fallback paths
      const testReverseOrder = (withFakeKey: boolean) => {
        const fakeDetached = document.createElement('dialog');
        const fakeObj = { resolveModal: () => fakeDetached };
        if (withFakeKey) {
          Reflect.set(document, OVERLAY_RUNTIME_KEY, fakeObj);
        }
        const bgBeforeModals = isInertElement(bgInput);

        const dlgA = box.appendChild(document.createElement('dialog'));
        const inA = dlgA.appendChild(document.createElement('input'));
        const dlgB = box.appendChild(document.createElement('dialog'));
        const inB = dlgB.appendChild(document.createElement('input'));
        const hA = registerOverlay({ kind: 'modal', element: dlgA, onOpenChange() {} });
        const hB = registerOverlay({ kind: 'modal', element: dlgB, onOpenChange() {} });
        hB.setOpen(true);
        hA.setOpen(true);
        const during = {
          inAInert: isInertElement(inA),
          inAFocus: focusElement(inA, document),
          inBInert: isInertElement(inB),
          inBFocus: focusElement(inB, document),
          bgInert: isInertElement(bgInput),
        };
        hA.dispose();
        hB.dispose();
        dlgA.remove();
        dlgB.remove();
        const fakeKeyPreserved = withFakeKey
          ? Reflect.get(document, OVERLAY_RUNTIME_KEY) === fakeObj
          : true;
        const versionsCleaned = !Reflect.has(
          document,
          Symbol.for('@docouno/unica/OverlayRuntimeVersions'),
        );
        if (withFakeKey) {
          Reflect.deleteProperty(document, OVERLAY_RUNTIME_KEY);
        }
        const bgAfterIdle = isInertElement(bgInput);
        return { bgBeforeModals, during, fakeKeyPreserved, versionsCleaned, bgAfterIdle };
      };
      const reversePrimary = testReverseOrder(false);
      const reverseFallback = testReverseOrder(true);

      // 4. <main inert><dialog showModal()><input> (light DOM + Shadow DOM)
      const inertMain = box.appendChild(document.createElement('main'));
      inertMain.inert = true;
      const lightModal = inertMain.appendChild(document.createElement('dialog'));
      const lightModalIn = lightModal.appendChild(document.createElement('input'));
      lightModal.showModal();
      const lightInertHost = {
        inert: isInertElement(lightModalIn),
        focus: focusElement(lightModalIn, document),
        bgInert: isInertElement(bgInput),
      };
      lightModal.close();

      const shadowInertHostEl = box.appendChild(document.createElement('div'));
      shadowInertHostEl.inert = true;
      const sRoot = shadowInertHostEl.attachShadow({ mode: 'open' });
      const shadowModal = sRoot.appendChild(document.createElement('dialog'));
      const shadowModalIn = shadowModal.appendChild(document.createElement('input'));
      shadowModal.showModal();
      const shadowInertHost = {
        inert: isInertElement(shadowModalIn),
        focus: focusElement(shadowModalIn, document),
      };
      shadowModal.close();

      const lower = registerOverlay({ kind: 'modal', element: lightModal, onOpenChange() {} });
      const upper = registerOverlay({ kind: 'modal', element: shadowModal, onOpenChange() {} });
      lower.setOpen(true);
      upper.setOpen(true);
      upper.beginExit();
      const exitingShadow = {
        stillModal: shadowModal.matches(':modal'),
        lowerInert: isInertElement(lightModalIn),
        upperInert: isInertElement(shadowModalIn),
        lowerFocus: focusElement(lightModalIn, document),
        backgroundInert: isInertElement(bgInput),
      };
      upper.finishExit();
      const lowerAfterExit = isInertElement(lightModalIn);
      lower.dispose();
      upper.setOpen(true);
      upper.beginExit();
      const backgroundDuringLastExit = isInertElement(bgInput);
      upper.dispose();

      // 5. CSS interactivity: inert cases + <dialog inert>
      const cssMain = box.appendChild(document.createElement('main'));
      cssMain.style.setProperty('interactivity', 'inert');
      const cssDlg1 = cssMain.appendChild(document.createElement('dialog'));
      const cssIn1 = cssDlg1.appendChild(document.createElement('input'));
      cssDlg1.showModal();
      const cssModalUnderInertMain = {
        inert: isInertElement(cssIn1),
        focus: focusElement(cssIn1, document),
      };
      cssDlg1.style.setProperty('interactivity', 'inert');
      const cssInertDialogItself = {
        inert: isInertElement(cssIn1),
        focus: focusElement(cssIn1, document),
      };
      cssDlg1.close();

      const cssDlg2 = box.appendChild(document.createElement('dialog'));
      const cssWrapInert = cssDlg2.appendChild(document.createElement('div'));
      cssWrapInert.style.setProperty('interactivity', 'inert');
      const cssInnerDirect = cssWrapInert.appendChild(document.createElement('input'));
      const cssWrapAuto = cssWrapInert.appendChild(document.createElement('div'));
      cssWrapAuto.style.setProperty('interactivity', 'auto');
      const cssInnerAuto = cssWrapAuto.appendChild(document.createElement('input'));
      cssDlg2.showModal();
      const cssNestedInert = {
        directInert: isInertElement(cssInnerDirect),
        directFocus: focusElement(cssInnerDirect, document),
        autoChildInert: isInertElement(cssInnerAuto),
        autoChildFocus: focusElement(cssInnerAuto, document),
      };
      cssDlg2.close();

      const attrInertDlg = box.appendChild(document.createElement('dialog'));
      attrInertDlg.inert = true;
      const attrInertIn = attrInertDlg.appendChild(document.createElement('input'));
      attrInertDlg.showModal();
      const attrInertDialog = {
        inert: isInertElement(attrInertIn),
        focus: focusElement(attrInertIn, document),
      };
      attrInertDlg.close();

      // 6. lockDocumentScroll: external mutation preserved on release + idempotent release
      const docStyle = document.documentElement.style;
      docStyle.setProperty('overflow-x', 'auto');
      docStyle.setProperty('overflow-y', 'scroll', 'important');
      const unlock = lockDocumentScroll(document);
      docStyle.setProperty('overflow-x', 'clip'); // external mutation during lock
      unlock();
      unlock(); // idempotent second release must not clobber
      const scrollLockResult = {
        overflowX: docStyle.getPropertyValue('overflow-x'),
        overflowY: docStyle.getPropertyValue('overflow-y'),
        overflowYPriority: docStyle.getPropertyPriority('overflow-y'),
      };
      docStyle.removeProperty('overflow-x');
      docStyle.removeProperty('overflow-y');

      box.remove();
      root.dataset.inertMatrix = JSON.stringify({
        unicaThenForeign,
        foreignThenUnica,
        reversePrimary,
        reverseFallback,
        lightInertHost,
        shadowInertHost,
        exitingShadow,
        lowerAfterExit,
        backgroundDuringLastExit,
        cssModalUnderInertMain,
        cssInertDialogItself,
        cssNestedInert,
        attrInertDialog,
        scrollLockResult,
      });
    };

    const start = () => {
      openCopies().catch((error: unknown) => window.reportError(error));
    };
    const startJoin = () => {
      checkProtocolJoinWarning().catch((error: unknown) => window.reportError(error));
    };
    const startCrossTriggers = () => {
      checkCrossBundleTriggers().catch((error: unknown) => window.reportError(error));
    };
    root.addEventListener('open-copies', start);
    root.addEventListener('check-cleanup', checkCleanup);
    root.addEventListener('open-shadow', prepareShadow);
    root.addEventListener('remove-shadow', moveShadow);
    root.addEventListener('check-shadow', checkShadow);
    root.addEventListener('adopt-popover', adoptPopover);
    root.addEventListener('open-iframe-modal', openIframeModal);
    root.addEventListener('navigate-dispose-iframe', navigateAndDisposeIframe);
    root.addEventListener('dispose-stale-popover', disposePopoverAfterNavigation);
    root.addEventListener('check-cross-doc-trigger', checkCrossDocTrigger);
    root.addEventListener('check-protocol-join-warning', startJoin);
    root.addEventListener('check-move-before-modal', checkMoveBeforeModal);
    root.addEventListener('check-cross-bundle-triggers', startCrossTriggers);
    root.addEventListener('check-inert-matrix', checkInertAndFocusMatrix);

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
