/**
 * Pure identity and viewport helpers for virtualization. This module models
 * logical keys and caller-supplied render state; it never inspects the DOM.
 */
export interface VirtualizationScope<TKey> {
  dataKeys: readonly TKey[];
  filteredKeys: readonly TKey[];
  registeredKeys: readonly TKey[];
  windowKeys: readonly TKey[];
  mountedKeys: readonly TKey[];
  selectedKeys: ReadonlySet<TKey>;
  activeKey: TKey | null;
}

export type VirtualizationScopeViolation =
  | 'filtered-key-missing-from-data'
  | 'registered-key-not-filtered'
  | 'viewport-key-not-filtered'
  | 'mounted-key-not-in-viewport';

export type AriaActiveDescendantEligibility<TKey> =
  | { available: true; key: TKey; optionId: string }
  | { available: false; key: TKey | null; optionId: null };

export interface ScrollToKeyIntent<TKey> {
  type: 'SCROLL_TO_KEY';
  key: TKey;
}

export interface ScrollToIndexIntent<TGeneration extends string | number> {
  type: 'SCROLL_TO_INDEX';
  index: number;
  dataGeneration: TGeneration;
}

/** Returns whether a selected key remains in the filtered result set. */
export function isSelectedKeyVisible<TKey>(
  scope: VirtualizationScope<TKey>,
  key: TKey,
): boolean {
  return scope.selectedKeys.has(key) && scope.filteredKeys.includes(key);
}

/** True only when the authoritative active key has a currently mounted target. */
export function isActiveKeyMounted<TKey>(scope: VirtualizationScope<TKey>): boolean {
  return scope.activeKey !== null && scope.mountedKeys.includes(scope.activeKey);
}

/**
 * Produces active-descendant eligibility from mounted keys and caller-provided
 * IDs. A registered or windowed key alone is not a mounted DOM target.
 */
export function getAriaActiveDescendantEligibility<TKey>(
  scope: VirtualizationScope<TKey>,
  optionIds: ReadonlyMap<TKey, string>,
): AriaActiveDescendantEligibility<TKey> {
  const key = scope.activeKey;
  const optionId = key === null || !scope.mountedKeys.includes(key) ? undefined : optionIds.get(key);

  if (key !== null && optionId?.trim()) {
    return { available: true, key, optionId };
  }

  return { available: false, key, optionId: null };
}

/** Copies selected identity without pruning keys absent from the current viewport. */
export function preserveSelectionAcrossWindow<TKey>(
  selectedKeys: ReadonlySet<TKey>,
  _windowKeys: readonly TKey[],
): Set<TKey> {
  return new Set(selectedKeys);
}

/** Resolves the key's current index, so reorder never reuses a stale index. */
export function resolveKeyIndex<TKey>(keys: readonly TKey[], key: TKey): number {
  return keys.indexOf(key);
}

/**
 * Returns keys in the half-open index range [startIndex, endIndex), clamped to
 * the source. Bounds are truncated to integers; an end before start is empty.
 */
export function computeWindowKeys<TKey>(
  filteredKeys: readonly TKey[],
  startIndex: number,
  endIndex: number,
): TKey[] {
  const start = Math.max(0, Math.min(filteredKeys.length, Math.trunc(startIndex)));
  const end = Math.max(start, Math.min(filteredKeys.length, Math.trunc(endIndex)));
  return filteredKeys.slice(start, end);
}

/** Creates a DOM-free request to bring a stable key into the rendered range. */
export function createScrollToKeyIntent<TKey>(key: TKey): ScrollToKeyIntent<TKey> {
  return { type: 'SCROLL_TO_KEY', key };
}

/** Creates an index request tied to the data generation that defined it. */
export function createScrollToIndexIntent<TGeneration extends string | number>(
  index: number,
  dataGeneration: TGeneration,
): ScrollToIndexIntent<TGeneration> {
  return { type: 'SCROLL_TO_INDEX', index, dataGeneration };
}

/** Lists violated subset relationships without changing the supplied scope. */
export function getVirtualizationScopeViolations<TKey>(
  scope: VirtualizationScope<TKey>,
): VirtualizationScopeViolation[] {
  const dataKeys = new Set(scope.dataKeys);
  const filteredKeys = new Set(scope.filteredKeys);
  const windowKeys = new Set(scope.windowKeys);
  const violations: VirtualizationScopeViolation[] = [];

  if (scope.filteredKeys.some((key) => !dataKeys.has(key))) {
    violations.push('filtered-key-missing-from-data');
  }
  if (scope.registeredKeys.some((key) => !filteredKeys.has(key))) {
    violations.push('registered-key-not-filtered');
  }
  if (scope.windowKeys.some((key) => !filteredKeys.has(key))) {
    violations.push('viewport-key-not-filtered');
  }
  if (scope.mountedKeys.some((key) => !windowKeys.has(key))) {
    violations.push('mounted-key-not-in-viewport');
  }

  return violations;
}
