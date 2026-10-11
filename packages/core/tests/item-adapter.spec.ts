import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultItemAdapter } from '../src/engine/item-adapter';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('default item identity', () => {
  it.each([
    { item: { id: 'id', key: 'key', value: 'value', code: 'code' }, key: 'id' },
    { item: { id: 0, key: 'key' }, key: 0 },
    { item: { id: '', key: 'key' }, key: '' },
    { item: { id: null, key: 'key', value: 'value' }, key: 'key' },
    { item: { id: {}, key: undefined, value: 'value', code: 'code' }, key: 'value' },
    { item: { code: 'code' }, key: 'code' },
    { item: { value: false }, key: 'false' },
  ])('extracts $key from $item', ({ item, key }) => {
    const adapter = createDefaultItemAdapter({ valueField: 'code', getValue: () => 'callback' });
    expect(adapter.getKey(item, 0)).toBe(key);
    expect(adapter.getKey(item, 42)).toBe(key);
  });

  it('uses configured value extraction before object identity', () => {
    const item = { nested: { code: 'IR-THR' } };
    const adapter = createDefaultItemAdapter<typeof item>({ getValue: (entry) => entry.nested.code });
    expect(adapter.getKey(item, 9)).toBe('IR-THR');
  });

  it('lets getKey override default fields without changing the business value', () => {
    const item = { id: 'row', code: 'IR-THR' };
    const adapter = createDefaultItemAdapter<typeof item>({
      getKey: (entry) => `custom:${entry.id}`,
      valueField: 'code',
    });
    expect(adapter.getKey(item, 0)).toBe('custom:row');
    expect(adapter.getValue(item, 0)).toBe('IR-THR');
  });

  it.each(['Apple', 0, 1, false, true, 2n, null, undefined, Symbol('item')])(
    'uses a position-independent string key for primitive %s',
    (item) => {
      const adapter = createDefaultItemAdapter();
      expect(adapter.getKey(item, 0)).toBe(String(item));
      expect(adapter.getKey(item, 42)).toBe(String(item));
      expect(adapter.getValue(item, 0)).toBe(item);
    },
  );

  it('keeps keyless reference identity stable without conflating equal-looking items', () => {
    const first = Object.freeze({ label: 'Apple' });
    const second = Object.freeze({ label: 'Apple' });
    const adapter = createDefaultItemAdapter();
    const key = adapter.getKey(first, 0);

    expect(adapter.getKey(first, 8)).toBe(key);
    expect(createDefaultItemAdapter().getKey(first, 3)).toBe(key);
    expect(adapter.getKey(second, 0)).not.toBe(key);
    expect(first).toEqual({ label: 'Apple' });
  });

  it('uses reference identity for function items rather than their position', () => {
    const item = () => 'item';
    const adapter = createDefaultItemAdapter();
    expect(adapter.getKey(item, 2)).toBe(adapter.getKey(item, 7));
  });

  it('only uses index fallback when explicitly requested and warns by default', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const adapter = createDefaultItemAdapter({ keyFallback: 'index' });
    const item = { label: 'Keyless' };

    expect(adapter.getKey(item, 0)).not.toBe(adapter.getKey(item, 1));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Using index as key is unstable'));
    warn.mockClear();
    expect(adapter.getKey({ id: 'stable' }, 9)).toBe('stable');
    expect(adapter.getKey(null, 9)).toBe('null');
    expect(warn).not.toHaveBeenCalled();
  });

  it('routes compatibility warnings through the supplied callback', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const onIndexFallback = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const adapter = createDefaultItemAdapter({ keyFallback: 'index', onIndexFallback });
    adapter.getKey({}, 0);

    expect(onIndexFallback).toHaveBeenCalledWith(expect.stringContaining('Provide getKey/valueField'));
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn for compatibility fallback in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const onIndexFallback = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createDefaultItemAdapter({ keyFallback: 'index', onIndexFallback }).getKey({}, 0);
    expect(onIndexFallback).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('default item value and presentation', () => {
  it('keeps identity, value, and label separate and extracts disabled/group fields', () => {
    const item = { id: 'row-8d7a', code: 'IR-THR', name: 'Tehran', disabled: true, group: 0 };
    const adapter = createDefaultItemAdapter({ valueField: 'code', labelField: 'name' });
    expect(adapter.getKey(item, 0)).toBe('row-8d7a');
    expect(adapter.getValue(item, 0)).toBe('IR-THR');
    expect(adapter.getLabel(item, 0)).toBe('Tehran');
    expect(adapter.isDisabled?.(item, 0)).toBe(true);
    expect(adapter.getGroupKey?.(item, 0)).toBe('0');
  });

  it('prioritizes callbacks and passes their original item and index', () => {
    const item = { id: 'row', value: 'legacy', label: 'legacy', disabled: false, group: 'legacy' };
    const getValue = vi.fn(() => null);
    const getLabel = vi.fn(() => '');
    const isDisabled = vi.fn(() => true);
    const getGroupKey = vi.fn(() => null);
    const adapter = createDefaultItemAdapter({ getValue, getLabel, isDisabled, getGroupKey });

    expect(adapter.getValue(item, 5)).toBeNull();
    expect(adapter.getLabel(item, 5)).toBe('');
    expect(adapter.isDisabled?.(item, 5)).toBe(true);
    expect(adapter.getGroupKey?.(item, 5)).toBeNull();
    for (const callback of [getValue, getLabel, isDisabled, getGroupKey]) {
      expect(callback).toHaveBeenCalledWith(item, 5);
    }
  });

  it('preserves falsy business values and falls back to legacy fields', () => {
    const adapter = createDefaultItemAdapter({ valueField: 'code', labelField: 'name' });
    expect(adapter.getValue({ code: null, value: 'fallback' }, 0)).toBeNull();
    expect(adapter.getValue({ code: 0, value: 'fallback' }, 0)).toBe(0);
    expect(adapter.getValue({ value: false }, 0)).toBe(false);
    expect(adapter.getLabel({ name: '', label: 'fallback' }, 0)).toBe('');
    expect(adapter.getLabel({ label: 'Label', text: 'Text' }, 0)).toBe('Label');
    expect(adapter.getLabel({ text: 'Text' }, 0)).toBe('Text');

    const item = {};
    expect(adapter.getValue(item, 0)).toBe(item);
    expect(adapter.getLabel(item, 0)).toBe(String(item));
    expect(adapter.isDisabled?.(item, 0)).toBe(false);
    expect(adapter.getGroupKey?.(item, 0)).toBeNull();
  });
});
