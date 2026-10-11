import type { SelectKey } from './contracts.js';

/** Extract identity separately from the outward value and presentation fields. */
export interface ItemAdapter<TItem, TKey extends SelectKey = SelectKey, TValue = unknown> {
  getKey(item: TItem, index: number): TKey;
  getValue(item: TItem, index: number): TValue;
  getLabel(item: TItem, index: number): string;
  isDisabled?(item: TItem, index: number): boolean;
  getGroupKey?(item: TItem, index: number): string | null;
}

export interface DefaultItemAdapterOptions<TItem = unknown, TValue = unknown> {
  getKey?: (item: TItem, index: number) => SelectKey;
  valueField?: string;
  labelField?: string;
  getValue?: (item: TItem, index: number) => TValue;
  getLabel?: (item: TItem, index: number) => string;
  isDisabled?: (item: TItem, index: number) => boolean;
  getGroupKey?: (item: TItem, index: number) => string | null;
  /** Explicit compatibility opt-in for keyless references; defaults to identity. */
  keyFallback?: 'identity' | 'index';
  onIndexFallback?: (message: string) => void;
}

const objectKeyCache = new WeakMap<object, string>();
let generatedObjectKeyId = 0;

function isObjectRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function readField(item: unknown, field: string | undefined): unknown {
  if (!field || !isObjectRecord(item)) return undefined;
  return item[field];
}

function toSelectKey(value: unknown): SelectKey | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean' || typeof value === 'bigint' || typeof value === 'symbol') {
    return String(value);
  }

  return null;
}

function objectIdentityKey(item: object): string {
  const cached = objectKeyCache.get(item);
  if (cached) return cached;

  generatedObjectKeyId += 1;
  const key = `__smilodon-object-${generatedObjectKeyId}`;
  objectKeyCache.set(item, key);
  return key;
}

function indexFallbackKey(index: number, warn?: (message: string) => void): string {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
  if (env !== 'production') {
    const message = '[Smilodon Phase2] Using index as key is unstable under filtering/sorting. Provide getKey/valueField for stable selection.';
    if (warn) {
      warn(message);
    } else {
      console.warn(message);
    }
  }
  return `__smilodon-index-${index}`;
}

/** Generated reference keys survive reorder, but not replacement with new objects. */
export function createDefaultItemAdapter<TItem = unknown, TValue = unknown>(
  options: DefaultItemAdapterOptions<TItem, TValue> = {},
): ItemAdapter<TItem> {
  return {
    getKey(item, index) {
      if (options.getKey) {
        return options.getKey(item, index);
      }

      if (isObjectRecord(item)) {
        const directKey =
          toSelectKey(item.id)
          ?? toSelectKey(item.key)
          ?? toSelectKey(item.value)
          ?? toSelectKey(readField(item, options.valueField));

        if (directKey !== null) {
          return directKey;
        }

        if (options.getValue) {
          const configuredValueKey = toSelectKey(options.getValue(item, index));
          if (configuredValueKey !== null) {
            return configuredValueKey;
          }
        }

        return options.keyFallback === 'index'
          ? indexFallbackKey(index, options.onIndexFallback)
          : objectIdentityKey(item);
      }

      return String(item);
    },

    getValue(item, index) {
      if (options.getValue) {
        return options.getValue(item, index);
      }

      const fieldValue = readField(item, options.valueField);
      if (fieldValue !== undefined) {
        return fieldValue;
      }

      return isObjectRecord(item) && item.value !== undefined ? item.value : item;
    },

    getLabel(item, index) {
      if (options.getLabel) {
        return options.getLabel(item, index);
      }

      const fieldLabel = readField(item, options.labelField);
      if (fieldLabel !== undefined) {
        return String(fieldLabel);
      }

      if (isObjectRecord(item) && item.label !== undefined) {
        return String(item.label);
      }

      if (isObjectRecord(item) && item.text !== undefined) {
        return String(item.text);
      }

      return String(item);
    },

    isDisabled(item, index) {
      if (options.isDisabled) {
        return options.isDisabled(item, index);
      }

      return Boolean(isObjectRecord(item) && item.disabled);
    },

    getGroupKey(item, index) {
      if (options.getGroupKey) {
        return options.getGroupKey(item, index);
      }

      if (!isObjectRecord(item) || item.group === undefined) {
        return null;
      }

      return item.group == null ? null : String(item.group);
    },
  };
}
