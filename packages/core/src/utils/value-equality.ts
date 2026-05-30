/**
 * Compare select item values with loose primitive coercion.
 * Treats string/number pairs like `"1"` and `1` as equal.
 */
export function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a == null || b == null) return false;

  if (typeof a === 'string' && typeof b === 'number') {
    return a === String(b);
  }

  if (typeof a === 'number' && typeof b === 'string') {
    return String(a) === b;
  }

  return false;
}

/** Returns true when `values` contains a value equal to `target`. */
export function arrayIncludesValue(values: readonly unknown[], target: unknown): boolean {
  for (let i = 0; i < values.length; i += 1) {
    if (valuesEqual(values[i], target)) return true;
  }
  return false;
}

/** Returns true when two value arrays match positionally with loose equality. */
export function arraysEqualByValue(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    if (!valuesEqual(a[i], b[i])) return false;
  }

  return true;
}
