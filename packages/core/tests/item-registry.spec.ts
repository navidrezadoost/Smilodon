import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultItemAdapter, type ItemAdapter } from '../src/engine/item-adapter';
import { createItemRegistry } from '../src/engine/item-registry';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const items = Object.freeze([
  Object.freeze({ id: 'a', value: 'APL', label: 'Apple' }),
  Object.freeze({ id: 'b', value: 'BAN', label: 'Banana' }),
  Object.freeze({ id: 'c', value: 'CHR', label: 'Cherry' }),
]);

describe('item registry', () => {
  it('builds coherent lookups without mutating frozen input', () => {
    const registry = createItemRegistry(items, createDefaultItemAdapter());

    expect(registry.records.map((record) => record.item)).toEqual(items);
    for (const [index, item] of items.entries()) {
      expect(registry.indexToKey.get(index)).toBe(item.id);
      expect(registry.keyToIndex.get(item.id)).toBe(index);
      expect(registry.keyToRecord.get(item.id)).toBe(registry.records[index]);
      expect(registry.records[index]).toEqual({
        key: item.id, item, index, label: item.label, value: item.value,
        disabled: false, groupKey: null,
      });
    }
    expect(registry.duplicateKeys).toEqual([]);
    expect(registry.keyToRecord.get('missing')).toBeUndefined();
    expect(registry.indexToKey.get(-1)).toBeUndefined();
  });

  it('accepts a custom typed adapter and defaults optional metadata', () => {
    const adapter: ItemAdapter<{ code: number; name: string }, number, string> = {
      getKey: (item) => item.code,
      getValue: (item) => `business:${item.code}`,
      getLabel: (item) => item.name,
    };
    const registry = createItemRegistry([{ code: 12, name: 'Tehran' }], adapter);
    expect(registry.keyToRecord.get(12)).toMatchObject({
      key: 12, value: 'business:12', label: 'Tehran', disabled: false, groupKey: null,
    });
  });

  it('extracts each presentation field with the original index', () => {
    const adapter: ItemAdapter<string> = {
      getKey: (item) => item,
      getValue: (item, index) => `${item}:${index}`,
      getLabel: (item, index) => `${index}. ${item}`,
      isDisabled: (_, index) => index === 1,
      getGroupKey: (_, index) => index === 1 ? 'disabled' : null,
    };
    const registry = createItemRegistry(['a', 'b'], adapter);
    expect(registry.keyToRecord.get('b')).toEqual({
      key: 'b', item: 'b', index: 1, value: 'b:1', label: '1. b', disabled: true, groupKey: 'disabled',
    });
  });

  it('handles an empty item list', () => {
    const registry = createItemRegistry([], createDefaultItemAdapter());
    expect(registry.records).toEqual([]);
    expect(registry.keyToRecord.size).toBe(0);
    expect(registry.keyToIndex.size).toBe(0);
    expect(registry.indexToKey.size).toBe(0);
    expect(registry.duplicateKeys).toEqual([]);
  });
});

describe('registry identity stability', () => {
  it('resolves the selected key to Cherry after reordering instead of reusing its old index', () => {
    const adapter = createDefaultItemAdapter();
    const initial = createItemRegistry(items, adapter);
    const selectedKey = initial.indexToKey.get(2)!;
    const reordered = createItemRegistry([items[2], items[0], items[1]], adapter);

    expect(reordered.keyToIndex.get(selectedKey)).toBe(0);
    expect(reordered.keyToRecord.get(selectedKey)?.label).toBe('Cherry');
    expect(reordered.keyToRecord.get(selectedKey)?.value).toBe('CHR');
    expect(reordered.records[2].label).toBe('Banana');
    expect(initial.keyToIndex.get(selectedKey)).toBe(2);
    expect(initial.records[2].item).toBe(items[2]);
  });

  it('resolves multiple selected keys independently of the presentation order', () => {
    const adapter = createDefaultItemAdapter();
    const initial = createItemRegistry(items, adapter);
    const selectedKeys = new Set([initial.indexToKey.get(0)!, initial.indexToKey.get(2)!]);
    const reordered = createItemRegistry([...items].reverse(), adapter);

    expect([...selectedKeys].map((key) => reordered.keyToRecord.get(key)?.value)).toEqual(['APL', 'CHR']);
    expect([...selectedKeys].map((key) => reordered.keyToIndex.get(key))).toEqual([2, 0]);
  });

  it('allows hidden selection to resolve again when a filter is cleared', () => {
    const adapter = createDefaultItemAdapter();
    const full = createItemRegistry(items, adapter);
    const selectedKey = full.indexToKey.get(2)!;
    const visible = createItemRegistry(items.slice(0, 2), adapter);
    expect(visible.keyToRecord.has(selectedKey)).toBe(false);
    // Selection and the full record/cache belong to the caller, not the visible registry.
    expect(full.keyToRecord.get(selectedKey)?.label).toBe('Cherry');

    const restored = createItemRegistry([items[2], items[1], items[0]], adapter);
    expect(restored.keyToRecord.get(selectedKey)?.value).toBe('CHR');
    expect(restored.keyToIndex.get(selectedKey)).toBe(0);
  });

  it('resolves replacement objects by explicit key while updating their fields', () => {
    const adapter = createDefaultItemAdapter();
    const initial = createItemRegistry(items, adapter);
    const selectedKey = initial.indexToKey.get(2)!;
    const replacement = { id: 'c', value: 'CHR-NEW', label: 'Fresh Cherry', disabled: true, group: 'fruit' };
    const refreshed = createItemRegistry([replacement], adapter);

    expect(refreshed.keyToRecord.get(selectedKey)).toMatchObject({
      item: replacement, value: 'CHR-NEW', label: 'Fresh Cherry', disabled: true, groupKey: 'fruit',
    });
    expect(initial.keyToRecord.get(selectedKey)?.value).toBe('CHR');
  });

  it('preserves generated reference keys through reorder and filtering', () => {
    const adapter = createDefaultItemAdapter();
    const apple = { label: 'Apple' };
    const cherry = { label: 'Cherry' };
    const initial = createItemRegistry([apple, cherry], adapter);
    const selectedKey = initial.indexToKey.get(1)!;
    const reordered = createItemRegistry([cherry, apple], adapter);
    const filtered = createItemRegistry([cherry], adapter);

    expect(reordered.keyToRecord.get(selectedKey)?.item).toBe(cherry);
    expect(filtered.keyToRecord.get(selectedKey)?.item).toBe(cherry);
    expect(filtered.keyToIndex.get(selectedKey)).toBe(0);
    expect(createItemRegistry([{ ...cherry }], adapter).keyToRecord.has(selectedKey)).toBe(false);
  });
});

describe('duplicate key policy', () => {
  const duplicates = [{ id: 1, label: 'A' }, { id: 1, label: 'B' }, { id: 1, label: 'C' }];
  const adapter = createDefaultItemAdapter();

  it.each(['test', 'development'])('throws by default in %s', (environment) => {
    vi.stubEnv('NODE_ENV', environment);
    expect(() => createItemRegistry(duplicates, adapter)).toThrow(
      'Duplicate item key "1" at indexes 0 and 1',
    );
  });

  it('defaults to strict duplicate handling without a process global', () => {
    vi.stubGlobal('process', undefined);
    expect(() => createItemRegistry(duplicates, adapter)).toThrow('Duplicate item key');
  });

  it('warns by default in production and keeps the first record', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registry = createItemRegistry(duplicates, adapter);

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenLastCalledWith(expect.stringContaining('indexes 0 and 2'));
    expect(registry.keyToRecord.get(1)?.item).toBe(duplicates[0]);
    expect(registry.keyToIndex.get(1)).toBe(0);
  });

  it('allows explicit strict handling in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => createItemRegistry(duplicates, adapter, { duplicateKeyPolicy: 'throw' })).toThrow();
  });

  it('routes warn diagnostics to a callback without duplicate console output', () => {
    const onDuplicateKey = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registry = createItemRegistry(duplicates, adapter, { duplicateKeyPolicy: 'warn', onDuplicateKey });

    expect(onDuplicateKey.mock.calls).toEqual([
      [{ key: 1, firstIndex: 0, duplicateIndex: 1 }],
      [{ key: 1, firstIndex: 0, duplicateIndex: 2 }],
    ]);
    expect(warn).not.toHaveBeenCalled();
    expect(registry.keyToRecord.get(1)?.label).toBe('A');
  });

  it.each([
    { policy: 'first-wins' as const, winner: 0 },
    { policy: 'last-wins' as const, winner: 2 },
  ])('$policy preserves input positions and resolves lookups to its winner', ({ policy, winner }) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registry = createItemRegistry(duplicates, adapter, { duplicateKeyPolicy: policy });

    expect(registry.records.map((record) => record.item)).toEqual(duplicates);
    expect([...registry.indexToKey]).toEqual([[0, 1], [1, 1], [2, 1]]);
    expect(registry.keyToRecord.get(1)).toBe(registry.records[winner]);
    expect(registry.keyToIndex.get(1)).toBe(winner);
    expect(registry.duplicateKeys).toEqual([
      { key: 1, firstIndex: 0, duplicateIndex: 1 },
      { key: 1, firstIndex: 0, duplicateIndex: 2 },
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('distinguishes numeric and string explicit keys', () => {
    const registry = createItemRegistry([{ id: 1 }, { id: '1' }], adapter);
    expect(registry.keyToRecord.size).toBe(2);
    expect(registry.keyToIndex.get(1)).toBe(0);
    expect(registry.keyToIndex.get('1')).toBe(1);
  });

  it.each([
    ['repeated primitives', ['a', 'a']],
    ['stringified primitives', [1, '1']],
    ['equal symbol descriptions', [Symbol('a'), Symbol('a')]],
  ])('diagnoses collisions from %s', (_, input) => {
    expect(() => createItemRegistry(input, adapter, { duplicateKeyPolicy: 'throw' })).toThrow('Duplicate item key');
  });

  it('diagnoses repeated references without rejecting distinct keyless objects', () => {
    const item = { label: 'Apple' };
    expect(() => createItemRegistry([item, item], adapter, { duplicateKeyPolicy: 'throw' })).toThrow();
    expect(createItemRegistry([item, { ...item }], adapter).keyToRecord.size).toBe(2);
  });
});
