import type {
  DataLoadingConfigIssue,
  DataLoadingConfigValidationResult,
  ResolvedDataLoadingConfig,
} from './public-types.js';

const DEFAULT_CONFIG: ResolvedDataLoadingConfig = {
  protocol: 'legacy',
  searchMode: 'local',
  paginationMode: 'page',
  firstPage: 1,
};

const ALLOWED_FIELDS = new Set([
  'protocol',
  'searchMode',
  'paginationMode',
  'firstPage',
  'fetchLimit',
]);

function issue(path: string, code: DataLoadingConfigIssue['code'], message: string): DataLoadingConfigIssue {
  return { path, code, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validatePositiveSafeInteger(
  candidate: Record<string, unknown>,
  key: 'firstPage' | 'fetchLimit',
  issues: DataLoadingConfigIssue[],
): void {
  const value = candidate[key];
  if (value === undefined) return;
  if (typeof value !== 'number') {
    issues.push(issue(key, 'invalid-type', `${key} must be a number.`));
    return;
  }
  if (!Number.isSafeInteger(value) || value <= 0) {
    issues.push(issue(key, 'invalid-positive-integer', `${key} must be a positive safe integer.`));
  }
}

/** Validate a complete effective per-instance data-loading configuration. */
export function validateDataLoadingConfig(candidate: unknown): DataLoadingConfigValidationResult {
  if (!isRecord(candidate)) {
    return {
      valid: false,
      issues: [issue('dataLoading', 'invalid-type', 'dataLoading must be a plain object.')],
    };
  }

  const issues: DataLoadingConfigIssue[] = [];
  for (const key of Object.keys(candidate).filter((candidateKey) => !ALLOWED_FIELDS.has(candidateKey)).sort()) {
    issues.push(issue(key, 'unknown-field', `Unknown dataLoading field: ${key}.`));
  }

  const protocolValue = candidate.protocol;
  const protocol = protocolValue === undefined ? DEFAULT_CONFIG.protocol : protocolValue;
  if (typeof protocol !== 'string') {
    issues.push(issue('protocol', 'invalid-type', 'protocol must be a string.'));
  } else if (protocol !== 'legacy' && protocol !== 'acknowledged') {
    issues.push(issue('protocol', 'invalid-value', 'protocol must be legacy or acknowledged.'));
  }

  const searchModeValue = candidate.searchMode;
  const searchMode = searchModeValue === undefined ? DEFAULT_CONFIG.searchMode : searchModeValue;
  if (typeof searchMode !== 'string') {
    issues.push(issue('searchMode', 'invalid-type', 'searchMode must be a string.'));
  } else if (searchMode !== 'local' && searchMode !== 'remote' && searchMode !== 'hybrid') {
    issues.push(issue('searchMode', 'invalid-value', 'searchMode must be local, remote, or hybrid.'));
  }

  const paginationModeValue = candidate.paginationMode;
  const paginationMode = paginationModeValue === undefined ? DEFAULT_CONFIG.paginationMode : paginationModeValue;
  if (typeof paginationMode !== 'string') {
    issues.push(issue('paginationMode', 'invalid-type', 'paginationMode must be a string.'));
  } else if (paginationMode !== 'page' && paginationMode !== 'cursor') {
    issues.push(issue('paginationMode', 'invalid-value', 'paginationMode must be page or cursor.'));
  }

  validatePositiveSafeInteger(candidate, 'firstPage', issues);
  validatePositiveSafeInteger(candidate, 'fetchLimit', issues);

  if (protocol === 'legacy' && (searchMode === 'remote' || searchMode === 'hybrid')) {
    issues.push(issue('searchMode', 'requires-acknowledged-protocol', 'Remote and hybrid search require the acknowledged protocol.'));
  }
  if (protocol === 'legacy' && paginationMode === 'cursor') {
    issues.push(issue('paginationMode', 'requires-acknowledged-protocol', 'Cursor pagination requires the acknowledged protocol.'));
  }

  if (issues.length > 0) return { valid: false, issues };

  const resolved: ResolvedDataLoadingConfig = {
    protocol: protocol as ResolvedDataLoadingConfig['protocol'],
    searchMode: searchMode as ResolvedDataLoadingConfig['searchMode'],
    paginationMode: paginationMode as ResolvedDataLoadingConfig['paginationMode'],
    firstPage: candidate.firstPage === undefined ? DEFAULT_CONFIG.firstPage : candidate.firstPage as number,
    ...(candidate.fetchLimit === undefined ? {} : { fetchLimit: candidate.fetchLimit as number }),
  };

  return { valid: true, value: resolved };
}
