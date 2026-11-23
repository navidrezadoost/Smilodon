import type {
  ScrollToSelectedConfig,
  SelectedOptionsConfig,
  SelectConfigUpdate,
} from './global-config.js';

export interface PublicConfigIssue {
  path: string;
  code: 'invalid-type' | 'invalid-value' | 'unknown-field';
  message: string;
}

export type PublicConfigValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; issues: readonly PublicConfigIssue[] };

type ConfigPatch<T> = Partial<T>;

const SELECTED_OPTIONS_FIELDS = new Set(['placement', 'groupedPlacement']);
const SCROLL_TO_SELECTED_FIELDS = new Set([
  'enabled',
  'multiSelectTarget',
  'onOpen',
  'behavior',
  'block',
]);
const placements = new Set(['original', 'selected-first']);
const groupedPlacements = new Set(['within-group']);
const scrollTargets = new Set(['first', 'last']);
const openPolicies = new Set(['preserve', 'reveal', 'align']);
const scrollBehaviors = new Set(['auto', 'instant', 'smooth']);
const scrollBlocks = new Set(['start', 'center', 'end', 'nearest']);

function asPlainRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null ? value as Record<string, unknown> : null;
}

function unknownFieldIssues(record: Record<string, unknown>, allowed: ReadonlySet<string>): PublicConfigIssue[] {
  return Object.keys(record)
    .filter((key) => !allowed.has(key))
    .sort()
    .map((key) => ({
      path: key,
      code: 'unknown-field' as const,
      message: `Unknown configuration field: ${key}.`,
    }));
}

function validateEnum(
  record: Record<string, unknown>,
  field: string,
  allowed: ReadonlySet<string>,
  issues: PublicConfigIssue[],
): void {
  const value = record[field];
  if (value === undefined) return;
  if (typeof value !== 'string') {
    issues.push({ path: field, code: 'invalid-type', message: `${field} must be a string.` });
  } else if (!allowed.has(value)) {
    issues.push({ path: field, code: 'invalid-value', message: `${field} has an unsupported value.` });
  }
}

/** Validate a partial selected-options configuration update. */
export function validateSelectedOptionsConfig(
  candidate: unknown,
): PublicConfigValidationResult<ConfigPatch<SelectedOptionsConfig>> {
  const record = asPlainRecord(candidate);
  if (!record) {
    return {
      valid: false,
      issues: [{ path: 'selectedOptions', code: 'invalid-type', message: 'selectedOptions must be a plain object.' }],
    };
  }

  const issues = unknownFieldIssues(record, SELECTED_OPTIONS_FIELDS);
  validateEnum(record, 'placement', placements, issues);
  validateEnum(record, 'groupedPlacement', groupedPlacements, issues);
  if (issues.length > 0) return { valid: false, issues };

  return {
    valid: true,
    value: {
      ...(record.placement === undefined ? {} : { placement: record.placement as SelectedOptionsConfig['placement'] }),
      ...(record.groupedPlacement === undefined
        ? {}
        : { groupedPlacement: record.groupedPlacement as SelectedOptionsConfig['groupedPlacement'] }),
    },
  };
}

/** Validate a partial scroll-to-selected configuration update. */
export function validateScrollToSelectedConfig(
  candidate: unknown,
): PublicConfigValidationResult<ConfigPatch<ScrollToSelectedConfig>> {
  const record = asPlainRecord(candidate);
  if (!record) {
    return {
      valid: false,
      issues: [{ path: 'scrollToSelected', code: 'invalid-type', message: 'scrollToSelected must be a plain object.' }],
    };
  }

  const issues = unknownFieldIssues(record, SCROLL_TO_SELECTED_FIELDS);
  if (record.enabled !== undefined && typeof record.enabled !== 'boolean') {
    issues.push({ path: 'enabled', code: 'invalid-type', message: 'enabled must be a boolean.' });
  }
  validateEnum(record, 'multiSelectTarget', scrollTargets, issues);
  validateEnum(record, 'onOpen', openPolicies, issues);
  validateEnum(record, 'behavior', scrollBehaviors, issues);
  validateEnum(record, 'block', scrollBlocks, issues);
  if (issues.length > 0) return { valid: false, issues };

  return {
    valid: true,
    value: {
      ...(record.enabled === undefined ? {} : { enabled: record.enabled as boolean }),
      ...(record.multiSelectTarget === undefined
        ? {}
        : { multiSelectTarget: record.multiSelectTarget as ScrollToSelectedConfig['multiSelectTarget'] }),
      ...(record.onOpen === undefined ? {} : { onOpen: record.onOpen as ScrollToSelectedConfig['onOpen'] }),
      ...(record.behavior === undefined ? {} : { behavior: record.behavior as ScrollToSelectedConfig['behavior'] }),
      ...(record.block === undefined ? {} : { block: record.block as ScrollToSelectedConfig['block'] }),
    },
  };
}

/** Validate and copy only the new public configuration sections. */
export function validateSelectedOptionsConfigUpdate(config: SelectConfigUpdate): SelectConfigUpdate {
  const result = { ...config } as SelectConfigUpdate;
  if (config.selectedOptions !== undefined) {
    const validation = validateSelectedOptionsConfig(config.selectedOptions);
    if (validation.valid) result.selectedOptions = validation.value;
    else delete result.selectedOptions;
  }
  if (config.scrollToSelected !== undefined) {
    const validation = validateScrollToSelectedConfig(config.scrollToSelected);
    if (validation.valid) result.scrollToSelected = validation.value;
    else delete result.scrollToSelected;
  }
  return result;
}
