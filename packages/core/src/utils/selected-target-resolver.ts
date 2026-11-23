/** Resolve the selected key at an edge of the displayed eligible ordering. */
export function resolveSelectedTargetKey<K>(
  orderedKeys: readonly K[],
  selectedKeys: ReadonlySet<K>,
  target: 'first' | 'last',
): K | null {
  if (target === 'first') {
    for (const key of orderedKeys) {
      if (selectedKeys.has(key)) return key;
    }
    return null;
  }

  for (let index = orderedKeys.length - 1; index >= 0; index -= 1) {
    const key = orderedKeys[index];
    if (selectedKeys.has(key)) return key;
  }
  return null;
}
