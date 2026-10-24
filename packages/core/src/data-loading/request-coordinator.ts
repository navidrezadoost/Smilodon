/**
 * DOM-independent coordinator for the opt-in acknowledged data-loading
 * protocol. This module is intentionally not re-exported from the package
 * entry point; public component/adapter integration is a later increment.
 */

export type DataRequestId = string;
export type QueryGeneration = number;
export type PageCursor = string | number;

export type DataRequestProtocol = 'legacy' | 'acknowledged';
export type DataSearchMode = 'local' | 'remote' | 'hybrid';
export type DataPaginationMode = 'page' | 'cursor';

const DEFAULT_MAX_CURSOR_PAGES = 256;
const HARD_MAX_CURSOR_PAGES = 4_096;
const DEFAULT_MAX_CURSOR_TOKEN_BYTES = 1_024;
const HARD_MAX_CURSOR_TOKEN_BYTES = 4_096;

export interface DataLoadingConfig {
  protocol?: DataRequestProtocol;
  searchMode?: DataSearchMode;
  paginationMode?: DataPaginationMode;
  firstPage?: number;
  fetchLimit?: number;
  /** Internal acknowledged-cursor policy; not a public component option yet. */
  maxCursorPages?: number;
  /** UTF-8 bytes per opaque cursor; internal until component integration is authorized. */
  maxCursorTokenBytes?: number;
}

export interface DataCoordinatorConfig {
  dataLoading?: DataLoadingConfig;
  infiniteScroll?: {
    pageSize?: number;
    initialPage?: number;
  };
}

export interface DataRequestBase {
  readonly requestId: DataRequestId;
  readonly queryGeneration: QueryGeneration;
  readonly query: string;
  readonly normalizedQuery: string;
  readonly fetchLimit: number;
  readonly position: PagePosition;
}

export interface SearchDataRequest extends DataRequestBase {
  readonly kind: 'search';
  readonly mode: 'remote' | 'hybrid';
}

export type PagePosition =
  | Readonly<{ mode: 'page'; page: number }>
  | Readonly<{ mode: 'cursor'; cursor?: PageCursor; ordinal: number }>;

export interface LoadMoreDataRequest extends DataRequestBase {
  readonly kind: 'loadMore';
}

export type DataRequest = SearchDataRequest | LoadMoreDataRequest;

export interface DataRequestError {
  readonly message: string;
  readonly code?: string;
  readonly retryable?: boolean;
}

export interface DataRequestCancelNotification {
  readonly requestId: DataRequestId;
  readonly queryGeneration: QueryGeneration;
  readonly reason: 'query-changed' | 'config-changed' | 'disconnected';
}

export type DataRequestCompletion =
  | Readonly<{
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      status: 'succeeded';
      items: readonly unknown[];
      hasMore: true;
      nextCursor?: PageCursor;
    }>
  | Readonly<{
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      status: 'empty';
      hasMore: true;
      advance: 'next' | 'retry';
      nextCursor?: PageCursor;
    }>
  | Readonly<{
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      status: 'exhausted';
      items: readonly unknown[];
      hasMore: false;
    }>
  | Readonly<{
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      status: 'failed';
      error: DataRequestError;
    }>
  | Readonly<{
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      status: 'cancelled';
      reason?: 'host-cancelled';
    }>;

export type DataRequestCompletionResult = 'accepted' | 'stale' | 'unknown-request' | 'invalid' | 'resource-limit';

export type DataCoordinatorStatus =
  | 'idle'
  | 'requested'
  | 'loading'
  | 'succeeded'
  | 'empty'
  | 'exhausted'
  | 'failed'
  | 'cancelled'
  | 'resource-limited';

export type DataCoordinatorResourceLimit =
  | Readonly<{
      reason: 'cursor-depth';
      maxCursorPages: number;
      requestId?: DataRequestId;
    }>
  | Readonly<{
      reason: 'cursor-token-size';
      maxCursorTokenBytes: number;
      actualCursorTokenBytes: number;
      requestId: DataRequestId;
    }>;

export type DataCoordinatorAction =
  | Readonly<{ type: 'request'; request: DataRequest }>
  | Readonly<{ type: 'cancel'; notification: DataRequestCancelNotification }>;

export interface CoordinatorValidationIssue {
  readonly field: string;
  readonly message: string;
}

export type ConfigurationValidation =
  | Readonly<{ valid: true; value: ResolvedDataCoordinatorConfig }>
  | Readonly<{ valid: false; errors: readonly CoordinatorValidationIssue[] }>;

export interface ResolvedDataCoordinatorConfig {
  readonly protocol: DataRequestProtocol;
  readonly searchMode: DataSearchMode;
  readonly paginationMode: DataPaginationMode;
  readonly firstPage: number;
  readonly initialPage: number;
  readonly fetchLimit?: number;
  readonly maxCursorPages: number;
  readonly maxCursorTokenBytes: number;
}

export interface DataRequestCoordinatorOptions {
  config?: DataCoordinatorConfig;
  initialQuery?: string;
  initialItems?: readonly unknown[];
  /** Whether another page/position is available for an acknowledged local list. */
  hasMore?: boolean;
}

export interface DataCoordinatorSnapshot {
  readonly status: DataCoordinatorStatus;
  readonly connected: boolean;
  readonly busy: boolean;
  readonly query: string;
  readonly normalizedQuery: string;
  readonly queryGeneration: QueryGeneration;
  readonly items: readonly unknown[];
  readonly hasMore: boolean;
  readonly activeRequest: DataRequest | null;
  readonly lastCommittedPage?: number;
  readonly nextEligiblePosition: PagePosition;
  readonly error: DataRequestError | null;
  /** A bounded-resource outcome; never aliases server exhaustion. */
  readonly resourceLimit: DataCoordinatorResourceLimit | null;
  readonly sentinelBlocked: boolean;
  readonly sentinelIntersecting: boolean;
}

export type ConfigurationUpdateResult =
  | Readonly<{ status: 'accepted'; actions: readonly DataCoordinatorAction[] }>
  | Readonly<{ status: 'invalid'; errors: readonly CoordinatorValidationIssue[] }>;

interface InternalRequest {
  request: DataRequest;
  phase: 'requested' | 'loading';
}

interface ParsedRequestId {
  readonly instanceId: number;
  readonly queryGeneration: number;
  readonly sequence: number;
  readonly check: string;
}

interface ConfigValidationInput {
  protocol: unknown;
  searchMode: unknown;
  paginationMode: unknown;
  firstPage: unknown;
  initialPage: unknown;
  fetchLimit: unknown;
  maxCursorPages: unknown;
  maxCursorTokenBytes: unknown;
  pageSize: unknown;
}

let coordinatorInstanceSequence = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isCursor(value: unknown): value is PageCursor {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

/** Count UTF-8 bytes without depending on DOM APIs or Node Buffer. */
function cursorTokenByteLength(cursor: PageCursor): number {
  const token = String(cursor);
  let bytes = 0;
  for (const character of token) {
    const codePoint = character.codePointAt(0) as number;
    if (codePoint <= 0x7f) bytes += 1;
    else if (codePoint <= 0x7ff) bytes += 2;
    else if (codePoint <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

function parseRequestId(value: string): ParsedRequestId | null {
  const match = /^data-(\d+)-generation-(\d+)-request-(\d+)-([a-z0-9]+)$/.exec(value);
  if (!match) return null;
  const [, instanceText, generationText, sequenceText, check] = match;
  const instanceId = Number(instanceText);
  const queryGeneration = Number(generationText);
  const sequence = Number(sequenceText);
  if (
    !Number.isSafeInteger(instanceId) || instanceId < 1 ||
    !Number.isSafeInteger(queryGeneration) || queryGeneration < 0 ||
    !Number.isSafeInteger(sequence) || sequence < 1
  ) return null;
  return Object.freeze({ instanceId, queryGeneration, sequence, check });
}

function requestIdCheck(
  secret: string,
  instanceId: number,
  queryGeneration: number,
  sequence: number,
): string {
  // A compact keyed check distinguishes IDs actually minted by this instance
  // from arbitrary strings without retaining a registry of historical IDs.
  let hash = 14695981039346656037n;
  const mask = (1n << 64n) - 1n;
  const input = `${secret}:${instanceId}:${queryGeneration}:${sequence}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = (hash * 1099511628211n) & mask;
  }
  return hash.toString(36);
}

function isQueryMode(value: unknown): value is DataSearchMode {
  return value === 'local' || value === 'remote' || value === 'hybrid';
}

function isPaginationMode(value: unknown): value is DataPaginationMode {
  return value === 'page' || value === 'cursor';
}

function frozenPosition(position: PagePosition): PagePosition {
  return Object.freeze({ ...position }) as PagePosition;
}

function exactKeys(record: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(record).every((key) => allowed.includes(key));
}

function asFrozenItems(items: readonly unknown[]): readonly unknown[] {
  return Object.freeze(Array.from(items));
}

function immutableActions(actions: DataCoordinatorAction[]): readonly DataCoordinatorAction[] {
  return Object.freeze(actions.slice());
}

function configInput(config: DataCoordinatorConfig = {}): ConfigValidationInput {
  const root = isRecord(config) ? config : {};
  const dataLoading = isRecord(root.dataLoading) ? root.dataLoading : {};
  const infiniteScroll = isRecord(root.infiniteScroll) ? root.infiniteScroll : {};
  return {
    protocol: dataLoading.protocol === undefined ? 'legacy' : dataLoading.protocol,
    searchMode: dataLoading.searchMode === undefined ? 'local' : dataLoading.searchMode,
    paginationMode: dataLoading.paginationMode === undefined ? 'page' : dataLoading.paginationMode,
    firstPage: dataLoading.firstPage === undefined ? 1 : dataLoading.firstPage,
    initialPage: infiniteScroll.initialPage === undefined ? 1 : infiniteScroll.initialPage,
    fetchLimit: dataLoading.fetchLimit,
    maxCursorPages: dataLoading.maxCursorPages === undefined
      ? DEFAULT_MAX_CURSOR_PAGES
      : dataLoading.maxCursorPages,
    maxCursorTokenBytes: dataLoading.maxCursorTokenBytes === undefined
      ? DEFAULT_MAX_CURSOR_TOKEN_BYTES
      : dataLoading.maxCursorTokenBytes,
    pageSize: infiniteScroll.pageSize,
  };
}

export function validateDataCoordinatorConfig(config: DataCoordinatorConfig = {}): ConfigurationValidation {
  const input = configInput(config);
  const errors: CoordinatorValidationIssue[] = [];
  const add = (field: string, message: string) => errors.push(Object.freeze({ field, message }));
  const rawConfig = config as unknown;
  if (!isRecord(rawConfig)) add('config', 'must be a plain object');
  else {
    if (rawConfig.dataLoading !== undefined && !isRecord(rawConfig.dataLoading)) {
      add('dataLoading', 'must be a plain object when supplied');
    }
    if (rawConfig.infiniteScroll !== undefined && !isRecord(rawConfig.infiniteScroll)) {
      add('infiniteScroll', 'must be a plain object when supplied');
    }
  }

  if (input.protocol !== 'legacy' && input.protocol !== 'acknowledged') {
    add('dataLoading.protocol', 'must be legacy or acknowledged');
  }
  if (!isQueryMode(input.searchMode)) {
    add('dataLoading.searchMode', 'must be local, remote, or hybrid');
  }
  if (!isPaginationMode(input.paginationMode)) {
    add('dataLoading.paginationMode', 'must be page or cursor');
  }
  if (!isPositiveSafeInteger(input.firstPage)) {
    add('dataLoading.firstPage', 'must be a positive safe integer');
  }
  if (!isPositiveSafeInteger(input.initialPage)) {
    add('infiniteScroll.initialPage', 'must be a positive safe integer');
  }
  if (
    input.protocol === 'acknowledged' &&
    input.searchMode === 'local' &&
    input.paginationMode === 'page' &&
    input.initialPage === Number.MAX_SAFE_INTEGER
  ) {
    add('infiniteScroll.initialPage', 'must leave room for the next acknowledged page number');
  }
  if (input.fetchLimit !== undefined && !isPositiveSafeInteger(input.fetchLimit)) {
    add('dataLoading.fetchLimit', 'must be a positive safe integer when supplied');
  }
  if (!isPositiveSafeInteger(input.maxCursorPages) || input.maxCursorPages > HARD_MAX_CURSOR_PAGES) {
    add('dataLoading.maxCursorPages', `must be a positive safe integer no greater than ${HARD_MAX_CURSOR_PAGES}`);
  }
  if (!isPositiveSafeInteger(input.maxCursorTokenBytes) || input.maxCursorTokenBytes > HARD_MAX_CURSOR_TOKEN_BYTES) {
    add(
      'dataLoading.maxCursorTokenBytes',
      `must be a positive safe integer no greater than ${HARD_MAX_CURSOR_TOKEN_BYTES}`,
    );
  }
  if (input.pageSize !== undefined && !isPositiveSafeInteger(input.pageSize)) {
    add('infiniteScroll.pageSize', 'must be a positive safe integer when supplied');
  }
  if (
    input.protocol === 'legacy' &&
    (input.searchMode === 'remote' || input.searchMode === 'hybrid' || input.paginationMode === 'cursor')
  ) {
    add('dataLoading.protocol', 'remote/hybrid search and cursor pagination require acknowledged protocol');
  }

  const resolvedFetchLimit =
    typeof input.fetchLimit === 'number' ? input.fetchLimit : typeof input.pageSize === 'number' ? input.pageSize : undefined;
  if (input.protocol === 'acknowledged' && resolvedFetchLimit === undefined) {
    add('dataLoading.fetchLimit', 'acknowledged requests require fetchLimit or an effective infiniteScroll.pageSize');
  }

  if (errors.length > 0) {
    return Object.freeze({ valid: false, errors: Object.freeze(errors) });
  }

  return Object.freeze({
    valid: true,
    value: Object.freeze({
      protocol: input.protocol as DataRequestProtocol,
      searchMode: input.searchMode as DataSearchMode,
      paginationMode: input.paginationMode as DataPaginationMode,
      firstPage: input.firstPage as number,
      initialPage: input.initialPage as number,
      fetchLimit: resolvedFetchLimit,
      maxCursorPages: input.maxCursorPages as number,
      maxCursorTokenBytes: input.maxCursorTokenBytes as number,
    }),
  });
}

function copyCoordinatorConfig(config: DataCoordinatorConfig = {}): DataCoordinatorConfig {
  return {
    dataLoading: config.dataLoading ? { ...config.dataLoading } : {},
    infiniteScroll: config.infiniteScroll ? { ...config.infiniteScroll } : {},
  };
}

function mergeCoordinatorConfig(
  current: DataCoordinatorConfig,
  update: DataCoordinatorConfig,
): DataCoordinatorConfig {
  return {
    dataLoading: { ...(current.dataLoading ?? {}), ...(update.dataLoading ?? {}) },
    infiniteScroll: { ...(current.infiniteScroll ?? {}), ...(update.infiniteScroll ?? {}) },
  };
}

/**
 * Owns request identity and pagination state only. It has no DOM, framework,
 * observer, timer, or network dependencies. Returned actions are instructions
 * for a future facade/host boundary; cancellation never performs transport.
 */
export class DataRequestCoordinator {
  private readonly instanceId = ++coordinatorInstanceSequence;
  private readonly requestIdSecret = Math.random().toString(36).slice(2) || '0';
  private requestSequence = 0;
  private rawConfig: DataCoordinatorConfig;
  private config: ResolvedDataCoordinatorConfig;
  private connected = false;
  private hasConnected = false;
  private query: string;
  private queryGeneration = 0;
  private items: readonly unknown[];
  private hasMore: boolean;
  private active: InternalRequest | null = null;
  private status: DataCoordinatorStatus = 'idle';
  private lastCommittedPage: number | undefined;
  private nextEligiblePosition: PagePosition;
  /**
   * Exact cycle detection for the current pagination epoch. One cursor is
   * retained per accepted advancement; there is intentionally no LRU eviction.
   */
  private committedCursors = new Set<PageCursor>();
  private generationHasAcceptedResult = false;
  private needsInitialRemoteSearch: boolean;
  private retryAvailable = false;
  private retryPosition: PagePosition | undefined;
  private retryKind: DataRequest['kind'] | undefined;
  private error: DataRequestError | null = null;
  private resourceLimit: DataCoordinatorResourceLimit | null = null;
  private sentinelBlocked = false;
  private sentinelIntersecting = false;

  constructor(options: DataRequestCoordinatorOptions = {}) {
    const initialConfig = options.config === undefined ? {} : options.config;
    const validation = validateDataCoordinatorConfig(initialConfig);
    if (!validation.valid) {
      throw new TypeError(validation.errors.map(({ field, message }) => `${field}: ${message}`).join('; '));
    }
    this.rawConfig = copyCoordinatorConfig(initialConfig);
    this.config = validation.value;
    this.query = options.initialQuery ?? '';
    this.items = asFrozenItems(options.initialItems ?? []);
    const remote = this.isRemoteMode();
    this.hasMore = remote ? false : options.hasMore ?? false;
    this.nextEligiblePosition = this.initialPosition();
    this.lastCommittedPage = this.config.paginationMode === 'page' && !remote
      ? this.config.initialPage
      : undefined;
    this.needsInitialRemoteSearch = remote;
  }

  getSnapshot(): DataCoordinatorSnapshot {
    const activeRequest = this.active?.request ?? null;
    const nextPosition = frozenPosition(this.nextEligiblePosition);
    return Object.freeze({
      status: this.status,
      connected: this.connected,
      busy: this.active !== null,
      query: this.query,
      normalizedQuery: this.query.trim(),
      queryGeneration: this.queryGeneration,
      items: asFrozenItems(this.items),
      hasMore: this.hasMore,
      activeRequest,
      lastCommittedPage: this.lastCommittedPage,
      nextEligiblePosition: nextPosition,
      error: this.error ? Object.freeze({ ...this.error }) : null,
      resourceLimit: this.resourceLimit,
      sentinelBlocked: this.sentinelBlocked,
      sentinelIntersecting: this.sentinelIntersecting,
    });
  }

  /** Connect once, dispatching the initial remote/hybrid query when required. */
  connect(query = this.query): readonly DataCoordinatorAction[] {
    if (this.connected) return immutableActions([]);

    const actions: DataCoordinatorAction[] = [];
    if (query !== this.query) actions.push(...this.setQuery(query));
    if (this.hasConnected) this.queryGeneration += 1;
    this.connected = true;
    this.hasConnected = true;

    if (this.isRemoteMode() && this.needsInitialRemoteSearch) {
      this.resetPaginationForRemoteQuery(true);
      const request = this.createSearchRequest();
      if (request) actions.push(Object.freeze({ type: 'request', request }));
    }
    return immutableActions(actions);
  }

  /**
   * Advance the request transition from synchronous `requested` to `loading`
   * immediately before a future facade dispatches event/callback notifications.
   */
  markNotificationsDispatched(requestId: DataRequestId): boolean {
    if (!this.active || this.active.request.requestId !== requestId || this.active.phase !== 'requested') {
      return false;
    }
    this.active.phase = 'loading';
    this.status = 'loading';
    return true;
  }

  setQuery(query: string): readonly DataCoordinatorAction[] {
    if (typeof query !== 'string' || query === this.query) return immutableActions([]);

    const actions: DataCoordinatorAction[] = [];
    const cancellation = this.invalidateActive('query-changed');
    if (cancellation) actions.push(cancellation);

    this.query = query;
    this.queryGeneration += 1;
    this.error = null;
    this.status = 'idle';
    this.generationHasAcceptedResult = false;
    this.retryAvailable = false;
    this.retryPosition = undefined;
    this.retryKind = undefined;
    this.committedCursors.clear();
    this.resourceLimit = null;
    this.sentinelBlocked = false;

    if (this.isRemoteMode()) {
      this.resetPaginationForRemoteQuery(true);
      this.needsInitialRemoteSearch = true;
      if (this.connected) {
        const request = this.createSearchRequest();
        if (request) actions.push(Object.freeze({ type: 'request', request }));
      }
    } else {
      this.lastCommittedPage = this.config.paginationMode === 'page' ? this.config.initialPage : undefined;
      this.nextEligiblePosition = this.initialPosition();
      this.needsInitialRemoteSearch = false;
    }
    return immutableActions(actions);
  }

  /** Update effective config; non-protocol changes do not rewrite active requests. */
  updateConfig(update: DataCoordinatorConfig): ConfigurationUpdateResult {
    const rawUpdate = update as unknown;
    if (
      !isRecord(rawUpdate) ||
      (rawUpdate.dataLoading !== undefined && !isRecord(rawUpdate.dataLoading)) ||
      (rawUpdate.infiniteScroll !== undefined && !isRecord(rawUpdate.infiniteScroll))
    ) {
      return Object.freeze({
        status: 'invalid',
        errors: Object.freeze([
          Object.freeze({ field: 'config', message: 'update and nested config groups must be plain objects' }),
        ]),
      });
    }
    const candidate = mergeCoordinatorConfig(this.rawConfig, update);
    const validation = validateDataCoordinatorConfig(candidate);
    if (!validation.valid) return Object.freeze({ status: 'invalid', errors: validation.errors });

    const previous = this.config;
    const next = validation.value;
    const protocolChanged =
      previous.protocol !== next.protocol ||
      previous.searchMode !== next.searchMode ||
      previous.paginationMode !== next.paginationMode;

    this.rawConfig = copyCoordinatorConfig(candidate);
    this.config = next;
    if (!protocolChanged) {
      this.refreshCursorDepthLimit();
      return Object.freeze({ status: 'accepted', actions: immutableActions([]) });
    }

    const actions: DataCoordinatorAction[] = [];
    const cancellation = this.invalidateActive('config-changed');
    if (cancellation) actions.push(cancellation);

    this.queryGeneration += 1;
    this.error = null;
    this.status = 'idle';
    this.generationHasAcceptedResult = false;
    this.retryAvailable = false;
    this.retryPosition = undefined;
    this.retryKind = undefined;
    this.committedCursors.clear();
    this.resourceLimit = null;
    this.sentinelBlocked = false;
    this.hasMore = this.isRemoteMode() ? false : this.hasMore;
    this.lastCommittedPage = this.config.paginationMode === 'page' && !this.isRemoteMode()
      ? this.config.initialPage
      : undefined;
    this.nextEligiblePosition = this.initialPosition();
    this.needsInitialRemoteSearch = this.isRemoteMode();

    if (this.connected && this.isRemoteMode()) {
      const request = this.createSearchRequest();
      if (request) actions.push(Object.freeze({ type: 'request', request }));
    }
    return Object.freeze({ status: 'accepted', actions: immutableActions(actions) });
  }

  /** Request another page or explicitly retry the still-eligible position. */
  requestLoadMore(trigger: 'manual' | 'sentinel' = 'manual'): readonly DataCoordinatorAction[] {
    if (this.config.protocol !== 'acknowledged' || !this.connected || this.active) {
      return immutableActions([]);
    }
    if (trigger === 'sentinel' && this.sentinelBlocked) return immutableActions([]);
    if (!this.hasMore && !this.retryAvailable) return immutableActions([]);

    const position = this.retryAvailable && this.retryPosition
      ? this.retryPosition
      : this.nextEligiblePosition;
    if (
      this.config.paginationMode === 'cursor' &&
      position.mode === 'cursor' &&
      position.ordinal > this.config.maxCursorPages
    ) {
      this.resourceLimit = Object.freeze({
        reason: 'cursor-depth',
        maxCursorPages: this.config.maxCursorPages,
      });
      this.status = 'resource-limited';
      this.sentinelBlocked = true;
      return immutableActions([]);
    }

    if (trigger === 'manual') this.sentinelBlocked = false;
    const retryKind = this.retryAvailable ? this.retryKind : undefined;
    this.retryAvailable = false;
    this.retryPosition = undefined;
    this.retryKind = undefined;

    const request = retryKind === 'search' && this.isRemoteMode()
      ? this.createSearchRequest(position)
      : this.createLoadMoreRequest(position);
    return request ? immutableActions([Object.freeze({ type: 'request', request })]) : immutableActions([]);
  }

  /** Feed observer state into the pure sentinel rearm state machine. */
  setSentinelIntersecting(intersecting: boolean): readonly DataCoordinatorAction[] {
    if (!intersecting) {
      this.sentinelIntersecting = false;
      this.sentinelBlocked = false;
      return immutableActions([]);
    }
    if (this.sentinelIntersecting) return immutableActions([]);
    this.sentinelIntersecting = true;
    return this.requestLoadMore('sentinel');
  }

  /** Invalidate pending work before returning its best-effort host cancellation action. */
  disconnect(): readonly DataCoordinatorAction[] {
    if (!this.connected) return immutableActions([]);
    const activeRequest = this.active?.request;
    const actions: DataCoordinatorAction[] = [];
    if (activeRequest) {
      if (activeRequest.kind === 'search' && !this.generationHasAcceptedResult) {
        this.needsInitialRemoteSearch = true;
      }
      const cancellation = this.invalidateActive('disconnected');
      if (cancellation) actions.push(cancellation);
      this.resourceLimit = null;
      this.status = 'cancelled';
      this.sentinelBlocked = true;
      // Encode invalidation in the generation, so late completions are stale
      // without retaining one request ID per cancellation.
      this.queryGeneration += 1;
    }
    this.sentinelIntersecting = false;
    this.connected = false;
    return immutableActions(actions);
  }

  completeDataRequest(completion: unknown): DataRequestCompletionResult {
    if (!isRecord(completion) || !this.hasValidCompletionEnvelope(completion)) return 'invalid';

    const requestId = completion.requestId as string;
    const generation = completion.queryGeneration as number;
    if (this.active?.request.requestId !== requestId) {
      return this.classifyInactiveRequest(requestId, generation);
    }
    if (generation !== this.active.request.queryGeneration || this.active.phase !== 'loading') return 'invalid';

    const validation = this.validateCompletionPayload(completion, this.active.request);
    if (!validation.valid) {
      if (validation.resourceLimit === 'cursor-token-size') {
        const cursor = completion.nextCursor as PageCursor;
        const actualCursorTokenBytes = cursorTokenByteLength(cursor);
        this.resourceLimit = Object.freeze({
          reason: 'cursor-token-size',
          maxCursorTokenBytes: this.config.maxCursorTokenBytes,
          actualCursorTokenBytes,
          requestId,
        });
        return 'resource-limit';
      }
      return 'invalid';
    }

    const request = this.active.request;
    const status = completion.status as DataRequestCompletion['status'];
    const nextData = status === 'succeeded' || status === 'exhausted'
      ? asFrozenItems(completion.items as readonly unknown[])
      : this.items;
    let nextPosition = this.nextEligiblePosition;
    let nextLastCommittedPage = this.lastCommittedPage;
    let nextHasMore = this.hasMore;
    let nextRetryAvailable = false;
    let nextRetryPosition: PagePosition | undefined;
    let nextRetryKind: DataRequest['kind'] | undefined;
    let nextError: DataRequestError | null = null;
    let nextSentinelBlocked = false;
    let cursorToCommit: PageCursor | undefined;
    let nextResourceLimit: DataCoordinatorResourceLimit | null = null;

    if (status === 'succeeded') {
      const advances = this.advanceFrom(request, completion as Record<string, unknown>);
      nextPosition = advances.position;
      nextLastCommittedPage = advances.lastCommittedPage;
      cursorToCommit = advances.cursorToCommit;
      nextHasMore = true;
    } else if (status === 'exhausted') {
      nextLastCommittedPage = request.position.mode === 'page'
        ? request.position.page
        : this.lastCommittedPage;
      nextHasMore = false;
    } else if (status === 'empty') {
      nextHasMore = true;
      nextSentinelBlocked = true;
      if (completion.advance === 'next') {
        const advances = this.advanceFrom(request, completion as Record<string, unknown>);
        nextPosition = advances.position;
        nextLastCommittedPage = advances.lastCommittedPage;
        cursorToCommit = advances.cursorToCommit;
      } else {
        nextRetryAvailable = true;
        nextRetryPosition = request.position;
        nextRetryKind = request.kind;
      }
    } else if (status === 'failed') {
      nextRetryAvailable = true;
      nextRetryPosition = request.position;
      nextRetryKind = request.kind;
      nextError = Object.freeze({ ...(completion.error as DataRequestError) });
      nextSentinelBlocked = true;
    } else if (status === 'cancelled') {
      nextRetryAvailable = true;
      nextRetryPosition = request.position;
      nextRetryKind = request.kind;
      nextSentinelBlocked = true;
    }

    if (
      this.config.paginationMode === 'cursor' &&
      nextHasMore &&
      nextPosition.mode === 'cursor' &&
      nextPosition.ordinal > this.config.maxCursorPages
    ) {
      nextResourceLimit = Object.freeze({
        reason: 'cursor-depth',
        maxCursorPages: this.config.maxCursorPages,
        requestId,
      });
      nextSentinelBlocked = true;
    }

    // Commit only after identity, generation, status, and every field validate.
    this.items = nextData;
    this.nextEligiblePosition = nextPosition;
    this.lastCommittedPage = nextLastCommittedPage;
    this.hasMore = nextHasMore;
    this.retryAvailable = nextRetryAvailable;
    this.retryPosition = nextRetryPosition;
    this.retryKind = nextRetryKind;
    this.error = nextError;
    this.resourceLimit = nextResourceLimit;
    this.sentinelBlocked = nextSentinelBlocked;
    if (cursorToCommit !== undefined) this.committedCursors.add(cursorToCommit);
    if (status === 'succeeded' || status === 'exhausted') this.generationHasAcceptedResult = true;
    this.active = null;
    this.status = nextResourceLimit ? 'resource-limited' : status;
    return 'accepted';
  }

  private isRemoteMode(): boolean {
    return this.config.searchMode === 'remote' || this.config.searchMode === 'hybrid';
  }

  private initialPosition(): PagePosition {
    if (this.config.paginationMode === 'cursor') {
      return Object.freeze({ mode: 'cursor' as const, ordinal: 1 });
    }
    const page = this.isRemoteMode() ? this.config.firstPage : this.config.initialPage + 1;
    return Object.freeze({ mode: 'page' as const, page });
  }

  private resetPaginationForRemoteQuery(clearItems: boolean): void {
    this.hasMore = false;
    this.lastCommittedPage = undefined;
    this.nextEligiblePosition = this.initialPosition();
    this.committedCursors.clear();
    this.retryAvailable = false;
    this.retryPosition = undefined;
    this.retryKind = undefined;
    this.resourceLimit = null;
    this.sentinelBlocked = false;
    this.error = null;
    if (clearItems) this.items = asFrozenItems([]);
  }

  /** Re-evaluate the local cursor cap without resetting accepted history. */
  private refreshCursorDepthLimit(): void {
    if (this.config.protocol !== 'acknowledged' || this.config.paginationMode !== 'cursor') return;
    const position = this.retryAvailable && this.retryPosition
      ? this.retryPosition
      : this.nextEligiblePosition;
    const overLimit = (this.hasMore || this.retryAvailable) &&
      position.mode === 'cursor' && position.ordinal > this.config.maxCursorPages;

    if (overLimit) {
      this.resourceLimit = Object.freeze({
        reason: 'cursor-depth',
        maxCursorPages: this.config.maxCursorPages,
      });
      if (!this.active) this.status = 'resource-limited';
      this.sentinelBlocked = true;
      return;
    }

    if (this.resourceLimit?.reason === 'cursor-depth') {
      this.resourceLimit = null;
      if (!this.active && this.status === 'resource-limited') this.status = 'idle';
    }
  }

  private createSearchRequest(position = this.nextEligiblePosition): DataRequest | null {
    if (!this.connected || !this.isRemoteMode() || this.config.protocol !== 'acknowledged') return null;
    const request = this.createRequest({ kind: 'search', mode: this.config.searchMode as 'remote' | 'hybrid' }, position);
    if (request) {
      this.needsInitialRemoteSearch = false;
      this.status = 'requested';
    }
    return request;
  }

  private createLoadMoreRequest(position: PagePosition): DataRequest | null {
    if (!this.connected || this.config.protocol !== 'acknowledged') return null;
    const request = this.createRequest({ kind: 'loadMore' }, position);
    if (request) this.status = 'requested';
    return request;
  }

  private createRequest(
    kind: { kind: 'search'; mode: 'remote' | 'hybrid' } | { kind: 'loadMore' },
    position: PagePosition,
  ): DataRequest | null {
    const fetchLimit = this.config.fetchLimit;
    if (fetchLimit === undefined || this.active) return null;
    this.requestSequence += 1;
    const check = requestIdCheck(
      this.requestIdSecret,
      this.instanceId,
      this.queryGeneration,
      this.requestSequence,
    );
    const requestId = `data-${this.instanceId}-generation-${this.queryGeneration}-request-${this.requestSequence}-${check}`;
    const base: DataRequestBase = Object.freeze({
      requestId,
      queryGeneration: this.queryGeneration,
      query: this.query,
      normalizedQuery: this.query.trim(),
      fetchLimit,
      position: frozenPosition(position),
    });
    const request: DataRequest = kind.kind === 'search'
      ? Object.freeze({ ...base, kind: 'search' as const, mode: kind.mode })
      : Object.freeze({ ...base, kind: 'loadMore' as const });
    this.active = { request, phase: 'requested' };
    this.status = 'requested';
    this.error = null;
    return request;
  }

  private invalidateActive(reason: DataRequestCancelNotification['reason']): DataCoordinatorAction | null {
    if (!this.active) return null;
    const { request } = this.active;
    this.active = null;
    this.status = 'cancelled';
    const notification = Object.freeze({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      reason,
    });
    return Object.freeze({ type: 'cancel', notification });
  }

  private classifyInactiveRequest(
    requestId: DataRequestId,
    completionGeneration: QueryGeneration,
  ): DataRequestCompletionResult {
    const parsed = parseRequestId(requestId);
    if (
      !parsed ||
      parsed.instanceId !== this.instanceId ||
      parsed.check !== requestIdCheck(
        this.requestIdSecret,
        parsed.instanceId,
        parsed.queryGeneration,
        parsed.sequence,
      ) ||
      parsed.sequence > this.requestSequence
    ) return 'unknown-request';
    if (parsed.queryGeneration !== completionGeneration) return 'invalid';
    return parsed.queryGeneration < this.queryGeneration ? 'stale' : 'unknown-request';
  }

  private hasValidCompletionEnvelope(completion: Record<string, unknown>): boolean {
    return (
      typeof completion.requestId === 'string' &&
      completion.requestId.length > 0 &&
      isNonNegativeSafeInteger(completion.queryGeneration) &&
      typeof completion.status === 'string' &&
      ['succeeded', 'empty', 'exhausted', 'failed', 'cancelled'].includes(completion.status)
    );
  }

  private validateCompletionPayload(
    completion: Record<string, unknown>,
    request: DataRequest,
  ): { valid: true } | { valid: false; resourceLimit?: 'cursor-token-size' } {
    const common = ['requestId', 'queryGeneration', 'status'];
    switch (completion.status) {
      case 'succeeded': {
        const allowed = [...common, 'items', 'hasMore'];
        if (request.position.mode === 'cursor') allowed.push('nextCursor');
        if (!exactKeys(completion, allowed) || !Array.isArray(completion.items) || completion.hasMore !== true) {
          return { valid: false };
        }
        if (request.position.mode === 'cursor') {
          if (request.position.ordinal >= Number.MAX_SAFE_INTEGER || !isCursor(completion.nextCursor)) {
            return { valid: false };
          }
          if (cursorTokenByteLength(completion.nextCursor) > this.config.maxCursorTokenBytes) {
            return { valid: false, resourceLimit: 'cursor-token-size' };
          }
          if (this.hasCommittedCursor(completion.nextCursor)) return { valid: false };
        } else if ('nextCursor' in completion) {
          return { valid: false };
        } else if (request.position.page >= Number.MAX_SAFE_INTEGER) {
          return { valid: false };
        }
        return { valid: true };
      }
      case 'empty': {
        const allowed = [...common, 'hasMore', 'advance'];
        if (request.position.mode === 'cursor' && completion.advance === 'next') allowed.push('nextCursor');
        if (!exactKeys(completion, allowed) || completion.hasMore !== true) return { valid: false };
        if (completion.advance !== 'next' && completion.advance !== 'retry') return { valid: false };
        if (request.position.mode === 'cursor') {
          if (completion.advance === 'next') {
            if (request.position.ordinal >= Number.MAX_SAFE_INTEGER || !isCursor(completion.nextCursor)) {
              return { valid: false };
            }
            if (cursorTokenByteLength(completion.nextCursor) > this.config.maxCursorTokenBytes) {
              return { valid: false, resourceLimit: 'cursor-token-size' };
            }
            if (this.hasCommittedCursor(completion.nextCursor)) return { valid: false };
          } else if ('nextCursor' in completion) {
            return { valid: false };
          }
        } else if ('nextCursor' in completion) {
          return { valid: false };
        } else if (completion.advance === 'next' && request.position.page >= Number.MAX_SAFE_INTEGER) {
          return { valid: false };
        }
        return { valid: true };
      }
      case 'exhausted': {
        if (
          !exactKeys(completion, [...common, 'items', 'hasMore']) ||
          !Array.isArray(completion.items) ||
          completion.hasMore !== false
        ) {
          return { valid: false };
        }
        return { valid: true };
      }
      case 'failed': {
        if (!exactKeys(completion, [...common, 'error']) || !isRecord(completion.error)) return { valid: false };
        const error = completion.error;
        if (
          !exactKeys(error, ['message', 'code', 'retryable']) ||
          typeof error.message !== 'string' ||
          error.message.trim().length === 0 ||
          (error.code !== undefined && typeof error.code !== 'string') ||
          (error.retryable !== undefined && typeof error.retryable !== 'boolean')
        ) {
          return { valid: false };
        }
        return { valid: true };
      }
      case 'cancelled': {
        const hasReason = 'reason' in completion;
        return (
          exactKeys(completion, hasReason ? [...common, 'reason'] : common) &&
          (!hasReason || completion.reason === undefined || completion.reason === 'host-cancelled')
        )
          ? { valid: true }
          : { valid: false };
      }
      default:
        return { valid: false };
    }
  }

  private hasCommittedCursor(cursor: PageCursor): boolean {
    return this.committedCursors.has(cursor) || (
      this.nextEligiblePosition.mode === 'cursor' && this.nextEligiblePosition.cursor === cursor
    );
  }

  private advanceFrom(
    request: DataRequest,
    completion: Record<string, unknown>,
  ): { position: PagePosition; lastCommittedPage: number | undefined; cursorToCommit?: PageCursor } {
    if (request.position.mode === 'page') {
      const page = request.position.page;
      return {
        position: Object.freeze({ mode: 'page' as const, page: page + 1 }),
        lastCommittedPage: page,
      };
    }
    const nextCursor = completion.nextCursor as PageCursor | undefined;
    return {
      position: Object.freeze({
        mode: 'cursor' as const,
        cursor: nextCursor,
        ordinal: request.position.ordinal + 1,
      }),
      lastCommittedPage: this.lastCommittedPage,
      cursorToCommit: nextCursor,
    };
  }
}
