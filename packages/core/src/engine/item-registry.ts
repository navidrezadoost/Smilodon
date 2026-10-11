import type { SelectKey } from './contracts.js';
import type { ItemAdapter } from './item-adapter.js';

export type DuplicateKeyPolicy =
  | 'throw'
  | 'warn'
  | 'first-wins'
  | 'last-wins';

export interface DuplicateKeyDiagnostic<TKey extends SelectKey = SelectKey> {
  readonly key: TKey;
  readonly firstIndex: number;
  readonly duplicateIndex: number;
}

export interface ItemRecord<TItem, TKey extends SelectKey = SelectKey> {
  readonly key: TKey;
  readonly item: TItem;
  readonly index: number;
  readonly label: string;
  readonly value: unknown;
  readonly disabled: boolean;
  readonly groupKey: string | null;
}

export interface ItemRegistry<TItem, TKey extends SelectKey = SelectKey> {
  /** Every input position, including duplicates; key lookups resolve the winner. */
  readonly records: readonly ItemRecord<TItem, TKey>[];
  readonly keyToRecord: ReadonlyMap<TKey, ItemRecord<TItem, TKey>>;
  readonly indexToKey: ReadonlyMap<number, TKey>;
  readonly keyToIndex: ReadonlyMap<TKey, number>;
  readonly duplicateKeys: readonly DuplicateKeyDiagnostic<TKey>[];
}

export interface ItemRegistryOptions<TKey extends SelectKey = SelectKey> {
  duplicateKeyPolicy?: DuplicateKeyPolicy;
  onDuplicateKey?: (diagnostic: DuplicateKeyDiagnostic<TKey>) => void;
}

export function getDefaultDuplicateKeyPolicy(): DuplicateKeyPolicy {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;

  return env === 'production' ? 'warn' : 'throw';
}

export function createItemRegistry<TItem, TKey extends SelectKey = SelectKey>(
  items: readonly TItem[],
  adapter: ItemAdapter<TItem, TKey>,
  options: ItemRegistryOptions<TKey> = {},
): ItemRegistry<TItem, TKey> {
  const duplicateKeyPolicy = options.duplicateKeyPolicy ?? getDefaultDuplicateKeyPolicy();
  const records: ItemRecord<TItem, TKey>[] = [];
  const keyToRecord = new Map<TKey, ItemRecord<TItem, TKey>>();
  const indexToKey = new Map<number, TKey>();
  const keyToIndex = new Map<TKey, number>();
  const firstIndexByKey = new Map<TKey, number>();
  const duplicateKeys: DuplicateKeyDiagnostic<TKey>[] = [];

  items.forEach((item, index) => {
    const key = adapter.getKey(item, index);
    const firstIndex = firstIndexByKey.get(key);
    const record: ItemRecord<TItem, TKey> = {
      key,
      item,
      index,
      label: adapter.getLabel(item, index),
      value: adapter.getValue(item, index),
      disabled: adapter.isDisabled?.(item, index) === true,
      groupKey: adapter.getGroupKey?.(item, index) ?? null,
    };

    records.push(record);
    indexToKey.set(index, key);

    if (firstIndex !== undefined) {
      const diagnostic = {
        key,
        firstIndex,
        duplicateIndex: index,
      };
      duplicateKeys.push(diagnostic);

      if (duplicateKeyPolicy === 'throw') {
        throw new Error(duplicateKeyMessage(diagnostic));
      }

      if (duplicateKeyPolicy === 'warn') {
        if (options.onDuplicateKey) {
          options.onDuplicateKey(diagnostic);
        } else {
          console.warn(duplicateKeyMessage(diagnostic));
        }
        return;
      }

      if (duplicateKeyPolicy === 'first-wins') {
        return;
      }
    } else {
      firstIndexByKey.set(key, index);
    }

    keyToRecord.set(key, record);
    keyToIndex.set(key, index);
  });

  return {
    records,
    keyToRecord,
    indexToKey,
    keyToIndex,
    duplicateKeys,
  };
}

function duplicateKeyMessage<TKey extends SelectKey>(diagnostic: DuplicateKeyDiagnostic<TKey>): string {
  return `[Smilodon Phase2] Duplicate item key "${String(diagnostic.key)}" at indexes ${diagnostic.firstIndex} and ${diagnostic.duplicateIndex}. Provide stable unique keys for selection.`;
}
