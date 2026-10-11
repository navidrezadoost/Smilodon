import type { SelectKey } from './contracts.js';

export type SelectionReason =
  | 'pointer'
  | 'keyboard'
  | 'programmatic'
  | 'form-reset'
  | 'external-value-sync';

export type ActiveReason =
  | 'keyboard'
  | 'pointer'
  | 'search'
  | 'open'
  | 'programmatic';

export interface SelectionConfig<TKey extends SelectKey = SelectKey> {
  multiple: boolean;
  required: boolean;
  /** Allows toggling off a selected single item; explicit deselect/clear still respect required. */
  allowDeselect: boolean;
  disabledKeys: ReadonlySet<TKey>;
  maxSelections?: number;
}

export type SelectionRequest<TKey extends SelectKey = SelectKey> =
  | { type: 'select'; key: TKey; reason: SelectionReason }
  | { type: 'deselect'; key: TKey; reason: SelectionReason }
  | { type: 'toggle'; key: TKey; reason: SelectionReason }
  | { type: 'clear'; reason: SelectionReason }
  | { type: 'replace'; keys: readonly TKey[]; reason: SelectionReason };

/** Pure key policy. Visibility does not constrain selection; disabled keys do. */
export function applySelectionRequest<TKey extends SelectKey>(
  selectedKeys: ReadonlySet<TKey>,
  request: SelectionRequest<TKey>,
  config: SelectionConfig<TKey>,
): ReadonlySet<TKey> {
  let next: ReadonlySet<TKey>;
  switch (request.type) {
    case 'select':
      next = selectKey(selectedKeys, request.key, config);
      break;
    case 'deselect':
      next = deselectKey(selectedKeys, request.key, config);
      break;
    case 'toggle':
      if (!selectedKeys.has(request.key)) {
        next = selectKey(selectedKeys, request.key, config);
      } else if (config.multiple || config.allowDeselect) {
        next = deselectKey(selectedKeys, request.key, config);
      } else {
        next = selectedKeys;
      }
      break;
    case 'clear':
      next = config.required && selectedKeys.size > 0
        ? selectedKeys
        : new Set<TKey>();
      break;
    case 'replace':
      next = replaceKeys(selectedKeys, request.keys, config);
      break;
  }

  // Set membership is authoritative. Reordering the same keys is not a change.
  return next.size === selectedKeys.size && [...next].every((key) => selectedKeys.has(key))
    ? selectedKeys
    : next;
}

function selectKey<TKey extends SelectKey>(
  selectedKeys: ReadonlySet<TKey>,
  key: TKey,
  config: SelectionConfig<TKey>,
): ReadonlySet<TKey> {
  if (config.disabledKeys.has(key)) {
    return selectedKeys;
  }

  if (!config.multiple) {
    return new Set<TKey>([key]);
  }

  if (selectedKeys.has(key)) {
    return selectedKeys;
  }

  const maxSelections = config.maxSelections ?? 0;
  if (maxSelections > 0 && selectedKeys.size >= maxSelections) {
    return selectedKeys;
  }

  return new Set<TKey>([...selectedKeys, key]);
}

function deselectKey<TKey extends SelectKey>(
  selectedKeys: ReadonlySet<TKey>,
  key: TKey,
  config: SelectionConfig<TKey>,
): ReadonlySet<TKey> {
  if (!selectedKeys.has(key) || config.disabledKeys.has(key)) {
    return selectedKeys;
  }

  if (config.required && selectedKeys.size <= 1) {
    return selectedKeys;
  }

  const next = new Set(selectedKeys);
  next.delete(key);
  return next;
}

function replaceKeys<TKey extends SelectKey>(
  selectedKeys: ReadonlySet<TKey>,
  keys: readonly TKey[],
  config: SelectionConfig<TKey>,
): ReadonlySet<TKey> {
  const next = normalizeKeys(keys, config);

  if (config.required && next.size === 0 && selectedKeys.size > 0) {
    // Required preserves a valid selection, but cannot keep newly disabled keys.
    return normalizeKeys(selectedKeys, config);
  }

  return next;
}

function normalizeKeys<TKey extends SelectKey>(
  keys: Iterable<TKey>,
  config: SelectionConfig<TKey>,
): ReadonlySet<TKey> {
  const seen = new Set<TKey>();
  const maxSelections = config.maxSelections ?? 0;

  for (const key of keys) {
    if (config.disabledKeys.has(key) || seen.has(key)) {
      continue;
    }

    seen.add(key);

    if (!config.multiple || (maxSelections > 0 && seen.size >= maxSelections)) {
      break;
    }
  }

  return seen;
}
