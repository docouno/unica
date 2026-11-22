export function cx(...values: readonly (string | false | null | undefined)[]): string {
  let result = '';
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value) {
      result = result ? `${result} ${value}` : value;
    }
  }
  return result;
}

export function dataFlag(active: boolean | undefined): '' | undefined {
  return active ? '' : undefined;
}
