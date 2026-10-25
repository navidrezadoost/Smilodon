import { describe, expect, it } from 'vitest';
import type { GlobalSelectConfig } from '../../src/config/global-config.js';
import type { EnhancedSelect } from '../../src/components/enhanced-select.js';
import { validateDataLoadingConfig } from '../../src/data-loading/public-config.js';
import type { SelectInstanceConfig } from '../../src/data-loading/public-types.js';

describe('public data-loading configuration validation', () => {
  it('applies the ratified legacy defaults without mutating its candidate', () => {
    const candidate = {};
    expect(validateDataLoadingConfig(candidate)).toEqual({
      valid: true,
      value: {
        protocol: 'legacy',
        searchMode: 'local',
        paginationMode: 'page',
        firstPage: 1,
      },
    });
    expect(candidate).toEqual({});
  });

  it('accepts acknowledged remote and cursor modes without requiring a public fetch limit', () => {
    expect(validateDataLoadingConfig({
      protocol: 'acknowledged',
      searchMode: 'remote',
      paginationMode: 'cursor',
      firstPage: 3,
    })).toEqual({
      valid: true,
      value: {
        protocol: 'acknowledged',
        searchMode: 'remote',
        paginationMode: 'cursor',
        firstPage: 3,
      },
    });
  });

  it('rejects unknown fields and invalid enum values with typed issues', () => {
    const result = validateDataLoadingConfig({
      protocol: 'surprise',
      paginationMode: 'offset',
      maxCursorPages: 12,
    });

    expect(result).toMatchObject({ valid: false });
    if (!result.valid) {
      expect(result.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'maxCursorPages', code: 'unknown-field' }),
        expect.objectContaining({ path: 'protocol', code: 'invalid-value' }),
        expect.objectContaining({ path: 'paginationMode', code: 'invalid-value' }),
      ]));
    }
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid positive safe integer firstPage/fetchLimit values (%s)',
    (value) => {
      const result = validateDataLoadingConfig({
        protocol: 'acknowledged',
        firstPage: value,
        fetchLimit: value,
      });

      expect(result).toMatchObject({ valid: false });
      if (!result.valid) {
        expect(result.issues.filter((entry) => entry.code === 'invalid-positive-integer')).toHaveLength(2);
      }
    },
  );

  it('distinguishes wrong numeric field types from invalid numeric values', () => {
    const result = validateDataLoadingConfig({ firstPage: '2', fetchLimit: null });
    expect(result).toMatchObject({ valid: false });
    if (!result.valid) {
      expect(result.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'firstPage', code: 'invalid-type' }),
        expect.objectContaining({ path: 'fetchLimit', code: 'invalid-type' }),
      ]));
    }
  });

  it('requires acknowledged mode for remote/hybrid search and cursor pagination', () => {
    const result = validateDataLoadingConfig({ searchMode: 'remote', paginationMode: 'cursor' });
    expect(result).toMatchObject({ valid: false });
    if (!result.valid) {
      expect(result.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'searchMode', code: 'requires-acknowledged-protocol' }),
        expect.objectContaining({ path: 'paginationMode', code: 'requires-acknowledged-protocol' }),
      ]));
    }
  });

  it.each([null, [], 'acknowledged', 1])('rejects non-object candidates (%s)', (candidate) => {
    expect(validateDataLoadingConfig(candidate)).toMatchObject({
      valid: false,
      issues: [expect.objectContaining({ path: 'dataLoading', code: 'invalid-type' })],
    });
  });
});

// Type-level compatibility sentinels: old one-argument callbacks remain valid,
// and global configuration does not acquire the per-instance dataLoading field.
const legacyCallbackConfig: SelectInstanceConfig = {
  callbacks: {
    onSearch: (query: string) => void query,
    onLoadMore: (page: number) => void page,
  },
};
void legacyCallbackConfig;
const legacyMethodConfig: Parameters<EnhancedSelect['updateConfig']>[0] = legacyCallbackConfig;
void legacyMethodConfig;
type IsAssignable<From, To> = [From] extends [To] ? true : false;
const legacyGlobalUpdatesRemainAssignable: IsAssignable<Partial<GlobalSelectConfig>, SelectInstanceConfig> = true;
void legacyGlobalUpdatesRemainAssignable;

const globalConfig = {} as GlobalSelectConfig;
// @ts-expect-error dataLoading is intentionally per-instance, not a global default
globalConfig.dataLoading = {};
