import {
  getDefaultView,
  getOwnerDocument,
  getRootNodeSafe,
  isConnectedNode,
  isElementNode,
} from '../../core/dom.js';

interface InputCallbacks {
  readonly refresh: (rootChanged: boolean) => void;
  readonly beforeClick: (event: Event) => void;
  readonly confirmInput: () => void;
}

interface InputBinding extends InputCallbacks {
  readonly input: HTMLInputElement;
  readonly row: HTMLElement;
  root: Node;
  form: HTMLFormElement | null;
  name: string;
  disabled: boolean;
}

interface RootBindings {
  readonly inputs: ReadonlyMap<HTMLInputElement, InputBinding>;
  readonly add: (binding: InputBinding) => void;
  readonly remove: (binding: InputBinding) => void;
  dispose: () => void;
}

const roots = /* @__PURE__ */ new WeakMap<Node, RootBindings>();

function createRootBindings(root: Node): RootBindings {
  const inputs = new Map<HTMLInputElement, InputBinding>();
  const pressed = new Map<number, InputBinding>();
  let hovered: InputBinding | undefined;
  const document = getOwnerDocument(root) ?? (root.nodeType === 9 ? (root as Document) : null);
  const view = getDefaultView(document);

  function bindingFor(event: Event): InputBinding | undefined {
    return isElementNode(event.target) ? inputs.get(event.target as HTMLInputElement) : undefined;
  }

  function click(event: Event): void {
    bindingFor(event)?.beforeClick(event);
  }

  function input(event: Event): void {
    bindingFor(event)?.confirmInput();
  }

  function externalLabel(event: PointerEvent): HTMLLabelElement | undefined {
    if (!isElementNode(event.target)) {
      return undefined;
    }
    const label = event.target.closest<HTMLLabelElement>('label');
    const input = label?.control;
    const binding = input && inputs.get(input as HTMLInputElement);
    return binding && label && !binding.row.contains(label) ? (label ?? undefined) : undefined;
  }

  function updateHover(next: InputBinding | undefined): void {
    if (next !== hovered) {
      hovered?.row.removeAttribute('data-unica-binary-external-hover');
      next?.row.setAttribute('data-unica-binary-external-hover', '');
      hovered = next;
    }
  }

  function over(event: PointerEvent): void {
    if (event.pointerType !== 'touch') {
      const label = externalLabel(event);
      updateHover(label ? inputs.get(label.control as HTMLInputElement) : undefined);
    }
  }

  function out(event: PointerEvent): void {
    const label = externalLabel(event);
    if (label && isElementNode(event.relatedTarget) && label.contains(event.relatedTarget)) {
      return;
    }
    if (label) {
      updateHover(undefined);
    }
  }

  function down(event: PointerEvent): void {
    const label = externalLabel(event);
    const binding = label && inputs.get(label.control as HTMLInputElement);
    if (event.isPrimary && event.button === 0 && binding) {
      pressed.set(event.pointerId, binding);
      binding.row.setAttribute('data-unica-binary-external-active', '');
    }
  }

  function release(event: PointerEvent): void {
    pressed.get(event.pointerId)?.row.removeAttribute('data-unica-binary-external-active');
    pressed.delete(event.pointerId);
  }

  function clear(): void {
    updateHover(undefined);
    for (const binding of pressed.values()) {
      binding.row.removeAttribute('data-unica-binary-external-active');
    }
    pressed.clear();
  }

  function refresh(): void {
    for (const binding of inputs.values()) {
      const { input } = binding;
      const rootChanged = syncRoot(binding);
      const { form, name } = input;
      const disabled = input.matches(':disabled');
      if (
        rootChanged ||
        form !== binding.form ||
        name !== binding.name ||
        disabled !== binding.disabled
      ) {
        binding.form = form;
        binding.name = name;
        binding.disabled = disabled;
        binding.refresh(rootChanged);
      }
    }
    if (hovered && !hovered.input.isConnected) {
      updateHover(undefined);
    }
    if (connection && isConnectedNode(root)) {
      connection.disconnect();
    }
  }

  const detached = !isConnectedNode(root);
  const observer = view && new view.MutationObserver(refresh);
  // A detached root can be inserted into a shadow tree outside the DOM observer.
  const connection =
    detached && view?.ResizeObserver ? new view.ResizeObserver(refresh) : undefined;
  observer?.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['disabled', 'form', 'id', 'name'],
  });
  if (detached && document && document !== root) {
    observer?.observe(document, { subtree: true, childList: true });
  }

  function listen(
    target: EventTarget,
    type: string,
    handler: (event: PointerEvent) => void,
  ): () => void {
    const listener = handler as EventListener;
    target.addEventListener(type, listener, true);
    return () => target.removeEventListener(type, listener, true);
  }

  const unbinds = [
    listen(root, 'pointerover', over),
    listen(root, 'pointerout', out),
    listen(root, 'pointerdown', down),
    listen(view ?? root, 'pointerup', release),
    listen(view ?? root, 'pointercancel', release),
  ];
  view?.addEventListener('blur', clear);
  const activationRoot = root === document ? (view ?? root) : root;
  activationRoot.addEventListener('click', click, true);
  activationRoot.addEventListener('input', input, true);
  return {
    inputs,
    add(binding) {
      inputs.set(binding.input, binding);
      if (connection && !isConnectedNode(root)) {
        connection.observe(binding.input);
      }
    },
    remove(binding) {
      inputs.delete(binding.input);
      connection?.unobserve(binding.input);
      if (hovered === binding) {
        updateHover(undefined);
      }
      for (const [pointerId, active] of pressed) {
        if (active === binding) {
          pressed.delete(pointerId);
          binding.row.removeAttribute('data-unica-binary-external-active');
        }
      }
    },
    dispose() {
      observer?.disconnect();
      connection?.disconnect();
      for (const unbind of unbinds) {
        unbind();
      }
      view?.removeEventListener('blur', clear);
      activationRoot.removeEventListener('click', click, true);
      activationRoot.removeEventListener('input', input, true);
      clear();
    },
  };
}

function register(root: Node, binding: InputBinding): void {
  let registry = roots.get(root);
  if (!registry) {
    registry = createRootBindings(root);
    roots.set(root, registry);
  }
  registry.add(binding);
}

function unregister(binding: InputBinding): void {
  const registry = roots.get(binding.root);
  registry?.remove(binding);
  if (registry?.inputs.size === 0) {
    registry.dispose();
    roots.delete(binding.root);
  }
}

function syncRoot(binding: InputBinding): boolean {
  const root = getRootNodeSafe(binding.input);
  if (root !== binding.root) {
    unregister(binding);
    binding.root = root;
    register(root, binding);
    return true;
  }
  return false;
}

export function bindBinaryInput(
  input: HTMLInputElement,
  row: HTMLElement,
  callbacks: InputCallbacks,
): () => void {
  const binding: InputBinding = {
    ...callbacks,
    input,
    row,
    root: getRootNodeSafe(input),
    form: input.form,
    name: input.name,
    disabled: input.matches(':disabled'),
  };
  register(binding.root, binding);
  return () => unregister(binding);
}
