export function composeEventHandlers<Args extends unknown[]>(
  first: ((...args: Args) => void) | undefined,
  next: ((...args: Args) => void) | undefined,
): (...args: Args) => void {
  return (...args) => {
    first?.(...args);
    const [event] = args;
    if (
      typeof event === 'object' &&
      event !== null &&
      'defaultPrevented' in event &&
      event.defaultPrevented === true
    ) {
      return;
    }
    next?.(...args);
  };
}
