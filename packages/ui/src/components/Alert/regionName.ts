import { useState } from 'react';
import type { RefObject } from 'react';
import {
  composedAncestors,
  getComputedStyleSafe,
  getLiveView,
  getRootNodeSafe,
  getShadowRootSafe,
} from '../../core/dom.js';
import { warnOnce } from '../../core/devWarning.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

export function plainName(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function hiddenForName(element: Element): boolean {
  const style = getComputedStyleSafe(element);
  return (
    element.matches('[hidden], [aria-hidden="true" i]') ||
    style?.display === 'none' ||
    style?.visibility === 'hidden' ||
    style?.visibility === 'collapse' ||
    style?.contentVisibility === 'hidden'
  );
}

interface NameSources {
  readonly events: Map<Element, readonly string[]>;
  readonly externalNodes: Set<Node>;
  readonly customNames: Set<string>;
}

const slotEvents = ['slotchange'];
const valueEvents = ['input', 'change'];
const textInputTypes = /* @__PURE__ */ new Set([
  'text',
  'search',
  'email',
  'tel',
  'url',
  'password',
  'number',
]);

function nameChildren(element: Element, sources: NameSources): readonly Node[] {
  const shadow = getShadowRootSafe(element);
  if (shadow) {
    sources.externalNodes.add(shadow);
    return [...shadow.childNodes];
  }
  if (element.localName.includes('-')) {
    sources.customNames.add(element.localName);
  }
  if (element.localName === 'slot' && 'assignedNodes' in element) {
    const slot = element as HTMLSlotElement;
    const assigned = slot.assignedNodes();
    sources.events.set(slot, slotEvents);
    if (assigned.length > 0) {
      for (const node of assigned) {
        sources.externalNodes.add(node);
      }
      return assigned;
    }
  }
  return [...element.childNodes];
}

function hasName(element: Element, includeHidden: boolean, sources: NameSources): boolean {
  if (element.matches('script, style, template') || (!includeHidden && hiddenForName(element))) {
    return false;
  }
  if (
    plainName(element.getAttribute('aria-label')) ||
    plainName(element.getAttribute('title')) ||
    (element.localName === 'img' && plainName(element.getAttribute('alt')))
  ) {
    return true;
  }
  if (
    element.localName === 'textarea' ||
    (element.localName === 'input' && textInputTypes.has((element as HTMLInputElement).type))
  ) {
    sources.events.set(element, valueEvents);
    return Boolean(plainName((element as HTMLInputElement | HTMLTextAreaElement).value));
  }
  return nameChildren(element, sources).some((node) =>
    node.nodeType === 1
      ? hasName(node as Element, includeHidden, sources)
      : node.nodeType === 3 && Boolean(plainName(node.textContent)),
  );
}

function hasReferencedName(element: Element, sources: NameSources): boolean {
  // An explicitly referenced hidden element can still name the landmark.
  const includeHidden = [...composedAncestors(element)].some(hiddenForName);
  return hasName(element, includeHidden, sources);
}

const nameAttributes = [
  'aria-label',
  'aria-hidden',
  'alt',
  'title',
  'hidden',
  'class',
  'style',
  'value',
  'type',
];

interface DefinitionListener {
  refresh: (() => void) | undefined;
}

function watchDefinition(
  registry: CustomElementRegistry,
  name: string,
  listener: DefinitionListener,
): void {
  void registry.whenDefined(name).then(
    () => listener.refresh?.(),
    () => undefined,
  );
}

interface ResolvedIds {
  readonly requested: string;
  readonly labelledBy: string | undefined;
}

export function useRegionName(
  root: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  label: string | undefined,
  requested: string | undefined,
): string | undefined {
  const [resolved, setResolved] = useState<ResolvedIds>();

  useIsoLayoutEffect(() => {
    const node = root.current;
    if (!enabled || !node) {
      return;
    }
    function warnUnnamed(): void {
      if (!label) {
        warnOnce('alert-unnamed-region', 'Alert with role="region" requires an accessible name.');
      }
    }
    if (!requested) {
      warnUnnamed();
      return;
    }

    const tree = getRootNodeSafe(node);
    const view = getLiveView(node.ownerDocument);
    if (!view || !('getElementById' in tree)) {
      return;
    }
    const scope = tree as Document | ShadowRoot;
    const requestedIds = requested;
    const ids = [...new Set(requestedIds.split(/\s+/u))];
    const resolveTargets = (): (Element | null)[] => ids.map((id) => scope.getElementById(id));
    let targets = resolveTargets();
    let current: string | undefined | null = null;
    let events: NameSources['events'] = new Map();
    const externalObserver = new view.MutationObserver(sync);
    const definitions = view.customElements;
    const waitingFor = new Set<string>();
    const definitionListener: DefinitionListener = { refresh: sync };

    function clearListeners(): void {
      for (const [element, types] of events) {
        for (const type of types) {
          element.removeEventListener(type, sync);
        }
      }
    }

    function sync(): void {
      const sources: NameSources = {
        events: new Map(),
        externalNodes: new Set(),
        customNames: new Set(),
      };
      const labelledBy =
        ids
          .filter((_, index) => {
            const target = targets[index];
            return target && hasReferencedName(target, sources);
          })
          .join(' ') || undefined;
      clearListeners();
      events = sources.events;
      for (const [element, types] of events) {
        for (const type of types) {
          element.addEventListener(type, sync);
        }
      }
      // An upgrade can attach a new shadow tree without a mutation in the current name source.
      for (const name of sources.customNames) {
        if (!waitingFor.has(name) && !definitions.get(name)) {
          waitingFor.add(name);
          watchDefinition(definitions, name, definitionListener);
        }
      }
      // Light DOM assignments and nested shadow descendants can live outside the IDREF's tree.
      externalObserver.disconnect();
      for (const part of sources.externalNodes) {
        externalObserver.observe(
          part,
          part.nodeType === 3
            ? { characterData: true }
            : {
                subtree: true,
                childList: true,
                characterData: true,
                attributes: true,
                attributeFilter: nameAttributes,
              },
        );
      }

      if (!labelledBy) {
        warnUnnamed();
      }
      if (labelledBy !== current) {
        current = labelledBy;
        setResolved({ requested: requestedIds, labelledBy });
      }
    }

    const observer = new view.MutationObserver((records) => {
      const latest = records.some(
        ({ type, attributeName }) => type === 'childList' || attributeName === 'id',
      )
        ? resolveTargets()
        : targets;
      const relevant =
        latest.some((target, index) => target !== targets[index]) ||
        records.some(({ target, type }) =>
          latest.some(
            (source) =>
              source &&
              (source.contains(target) || (type === 'attributes' && target.contains(source))),
          ),
        );
      if (relevant) {
        targets = latest;
        sync();
      }
    });
    observer.observe(scope, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['id', ...nameAttributes],
    });
    sync();
    return () => {
      observer.disconnect();
      externalObserver.disconnect();
      clearListeners();
      definitionListener.refresh = undefined;
    };
  }, [enabled, label, requested, root]);

  return resolved && resolved.requested === requested ? resolved.labelledBy : requested;
}
