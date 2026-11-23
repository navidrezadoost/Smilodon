/** A stable-key navigation view of the options in their rendered order. */
export interface VisualNavigationModel<K> {
  orderedKeys: readonly K[];
  selectableKeys: readonly K[];
  /** Zero-based rendered position for every key, including non-selectable keys. */
  positionByKey: ReadonlyMap<K, number>;
  /** Position among keyboard eligible keys. */
  selectablePositionByKey: ReadonlyMap<K, number>;
}

export function createVisualNavigationModel<K>(
  orderedKeys: readonly K[],
  isSelectable: (key: K) => boolean,
): VisualNavigationModel<K> {
  const ordered = [...orderedKeys];
  const selectableKeys: K[] = [];
  const positionByKey = new Map<K, number>();
  const selectablePositionByKey = new Map<K, number>();

  ordered.forEach((key, position) => {
    positionByKey.set(key, position);
    if (isSelectable(key)) {
      selectablePositionByKey.set(key, selectableKeys.length);
      selectableKeys.push(key);
    }
  });

  return { orderedKeys: ordered, selectableKeys, positionByKey, selectablePositionByKey };
}

/** Resolve a clamped keyboard movement in visual order. */
export function resolveVisualMovement<K>(
  model: VisualNavigationModel<K>,
  currentKey: K | null,
  delta: number,
): K | null {
  const { selectableKeys, selectablePositionByKey } = model;
  if (selectableKeys.length === 0) return null;

  const currentPosition = currentKey === null ? undefined : selectablePositionByKey.get(currentKey);
  const basePosition = currentPosition ?? (delta >= 0 ? -1 : selectableKeys.length);
  const nextPosition = Math.max(0, Math.min(selectableKeys.length - 1, basePosition + delta));
  return selectableKeys[nextPosition] ?? null;
}

export function resolveVisualBoundary<K>(
  model: VisualNavigationModel<K>,
  boundary: 'first' | 'last',
): K | null {
  return boundary === 'first'
    ? model.selectableKeys[0] ?? null
    : model.selectableKeys[model.selectableKeys.length - 1] ?? null;
}

/** Return selectable keys in the inclusive visual interval between two keys. */
export function resolveVisualRange<K>(
  model: VisualNavigationModel<K>,
  startKey: K,
  endKey: K,
): K[] {
  const startPosition = model.positionByKey.get(startKey);
  const endPosition = model.positionByKey.get(endKey);
  if (startPosition === undefined || endPosition === undefined) return [];

  const low = Math.min(startPosition, endPosition);
  const high = Math.max(startPosition, endPosition);
  const selectable = new Set(model.selectableKeys);
  return model.orderedKeys.slice(low, high + 1).filter((key) => selectable.has(key));
}
