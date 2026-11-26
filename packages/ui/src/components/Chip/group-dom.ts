import { recoverRovingKey } from '../../core/collections/navigation.js';
import {
  composedAncestors,
  getDefaultView,
  getRootActiveElement,
  getRootNodeSafe,
  isInertElement,
  matchesSafe,
} from '../../core/dom.js';

export function isChipAvailable(input: HTMLInputElement): boolean {
  return (
    input.isConnected &&
    !matchesSafe(input, ':disabled') &&
    !isInertElement(input) &&
    !input.closest('[hidden]') &&
    (input.checkVisibility?.({ visibilityProperty: true }) ?? true)
  );
}

export function chipInputs(options: HTMLDivElement | null): HTMLInputElement[] {
  return Array.from(options?.querySelectorAll<HTMLInputElement>('.unica-chip-native') ?? []);
}

function activeElement(group: HTMLElement): Element | null {
  return getRootActiveElement(getRootNodeSafe(group), group.ownerDocument);
}

interface ChipGroupDom {
  focus(input: HTMLInputElement): void;
  blur(input: HTMLInputElement, destination: EventTarget | null): void;
  sync(group: HTMLFieldSetElement, options: readonly HTMLInputElement[], single: boolean): void;
}

export function createChipGroupDom(): ChipGroupDom {
  let previous: readonly HTMLInputElement[] = [];
  let focused: HTMLInputElement | undefined;

  return {
    focus(input: HTMLInputElement) {
      focused = input;
    },
    blur(input: HTMLInputElement, destination: EventTarget | null) {
      if (focused !== input) {
        return;
      }
      if (destination) {
        focused = undefined;
        return;
      }
      // Removal or disabling can blur to the document before mutation delivery.
      queueMicrotask(() => {
        if (focused === input && isChipAvailable(input) && activeElement(input) !== input) {
          focused = undefined;
        }
      });
    },
    sync(group: HTMLFieldSetElement, options: readonly HTMLInputElement[], single: boolean) {
      const oldOptions = previous;
      previous = options;
      const available = options.filter(isChipAvailable);
      const active = activeElement(group);
      const entry = available.find((item) => item.checked) ?? available[0];
      const activeOption = available.find((item) => item === active);
      if (single) {
        const tabStop = activeOption ?? entry;
        for (const input of options) {
          const next = input === tabStop ? 0 : -1;
          if (input.tabIndex !== next) {
            input.tabIndex = next;
          }
        }
      }
      const userAgent = getDefaultView(group.ownerDocument)?.navigator.userAgent ?? '';
      const checkedUnavailable = options.some(
        (input) => input.checked && !available.includes(input),
      );
      // WebKit can skip the native set entirely if its checked member can't take focus.
      // The fieldset hands off that single entry to the available option.
      const bridge =
        single &&
        !activeOption &&
        entry?.name &&
        checkedUnavailable &&
        /AppleWebKit\//u.test(userAgent) &&
        !/(?:Chrome|Chromium|Edg|OPR)\//u.test(userAgent);
      const groupTabIndex = bridge ? 0 : -1;
      if (group.tabIndex !== groupTabIndex) {
        group.tabIndex = groupTabIndex;
      }
      if (bridge && active === group) {
        group.tabIndex = -1;
        entry.focus();
        return;
      }

      const missing = focused;
      if (!missing || (active === missing && available.includes(missing))) {
        return;
      }
      const stillAvailable = available.includes(missing);
      const orderChanged =
        options.length !== oldOptions.length ||
        options.some((input, index) => input !== oldOptions[index]);
      if (stillAvailable && !orderChanged) {
        return;
      }
      focused = undefined;
      if (
        (active &&
          active !== missing &&
          active !== group.ownerDocument.body &&
          active !== group.ownerDocument.documentElement) ||
        !group.isConnected ||
        matchesSafe(group, ':disabled') ||
        isInertElement(group)
      ) {
        return;
      }
      if (stillAvailable) {
        missing.focus({ preventScroll: true });
        return;
      }
      const availableKeys = new Set(available.map((input) => input.value));
      const key = recoverRovingKey(
        options.map((input) => ({
          key: input.value,
          label: '',
          navigable: availableKeys.has(input.value),
        })),
        oldOptions.map((input) => ({ key: input.value, label: '' })),
        missing.value,
      );
      (available.find((input) => input.value === key) ?? group).focus({ preventScroll: true });
    },
  };
}

export function observeChipAvailability(
  group: HTMLFieldSetElement,
  sync: () => void,
): (() => void) | undefined {
  const Observer = getDefaultView(group.ownerDocument)?.MutationObserver;
  if (!Observer) {
    return;
  }
  const observer = new Observer(() => {
    sync();
    // A reparented fieldset may have a different set of disabled/inert ancestors.
    observe();
  });
  const attributeFilter = ['disabled', 'inert', 'hidden'];

  function observe(): void {
    observer.disconnect();
    observer.observe(group, { subtree: true, childList: true, attributeFilter });
    for (const ancestor of composedAncestors(group)) {
      if (ancestor !== group) {
        observer.observe(ancestor, { childList: true, attributeFilter });
      }
    }
  }

  observe();
  return () => observer.disconnect();
}
