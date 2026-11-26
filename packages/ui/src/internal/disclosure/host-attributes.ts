export function withoutOwnedAttributes<Props extends object>(
  props: Props,
  ownedNames: ReadonlySet<string>,
  extraName?: string,
): Props {
  let clean = props;
  for (const name of Object.keys(props)) {
    // JSX spreads can carry raw attributes. HTML compares their names without case.
    const htmlName = name.toLowerCase();
    if (ownedNames.has(htmlName) || htmlName === extraName) {
      if (clean === props) {
        clean = { ...props };
      }
      Reflect.deleteProperty(clean, name);
    }
  }
  return clean;
}
