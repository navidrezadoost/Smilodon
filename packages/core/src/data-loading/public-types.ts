import type { CallbackConfig, GlobalSelectConfig } from '../config/global-config.js';

export type DataRequestId = string;
export type QueryGeneration = number;
export type PageCursor = string | number;

export interface DataLoadingConfig {
  protocol?: 'legacy' | 'acknowledged';
  searchMode?: 'local' | 'remote' | 'hybrid';
  paginationMode?: 'page' | 'cursor';
  firstPage?: number;
  fetchLimit?: number;
}

export interface ResolvedDataLoadingConfig {
  readonly protocol: 'legacy' | 'acknowledged';
  readonly searchMode: 'local' | 'remote' | 'hybrid';
  readonly paginationMode: 'page' | 'cursor';
  readonly firstPage: number;
  readonly fetchLimit?: number;
}

export type AcknowledgedCoreCallbacks =
  Omit<Partial<CallbackConfig>, 'onSearch' | 'onLoadMore'> & {
    onSearch?: (query: string, request?: SearchDataRequest) => void;
    onLoadMore?: (page: number, request?: LoadMoreDataRequest) => void;
  } & AcknowledgedCallbackAdditions;

export type SelectInstanceConfig = Omit<Partial<GlobalSelectConfig>, 'callbacks'> & {
  callbacks?: AcknowledgedCoreCallbacks;
  dataLoading?: Partial<DataLoadingConfig>;
};

export type DataLoadingConfigIssueCode =
  | 'unknown-field'
  | 'invalid-type'
  | 'invalid-value'
  | 'invalid-positive-integer'
  | 'requires-acknowledged-protocol';

export interface DataLoadingConfigIssue {
  path: string;
  code: DataLoadingConfigIssueCode;
  message: string;
}

export type DataLoadingConfigValidationResult =
  | { valid: true; value: ResolvedDataLoadingConfig }
  | { valid: false; issues: readonly DataLoadingConfigIssue[] };

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

export interface LoadMoreDataRequest extends DataRequestBase {
  readonly kind: 'loadMore';
}

export type PagePosition =
  | Readonly<{ mode: 'page'; page: number }>
  | Readonly<{ mode: 'cursor'; cursor?: PageCursor; ordinal: number }>;

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

export type DataRequestCompletionResult =
  | 'accepted'
  | 'stale'
  | 'unknown-request'
  | 'invalid'
  | 'resource-limit';

export type DataLoadingStatus =
  | 'idle'
  | 'requested'
  | 'loading'
  | 'succeeded'
  | 'empty'
  | 'exhausted'
  | 'failed'
  | 'cancelled'
  | 'resource-limited';

export type DataLoadingResourceLimit =
  | Readonly<{ reason: 'cursor-depth'; maxCursorPages: number; requestId?: DataRequestId }>
  | Readonly<{
      reason: 'cursor-token-size';
      maxCursorTokenBytes: number;
      actualCursorTokenBytes: number;
      requestId: DataRequestId;
    }>;

export interface DataLoadingStateSnapshot {
  readonly status: DataLoadingStatus;
  readonly connected: boolean;
  /** Core request or accepted-snapshot projection is still pending; excludes external presentation loading. */
  readonly busy: boolean;
  readonly projectionPending: boolean;
  readonly queryGeneration: QueryGeneration;
  readonly activeRequest: DataRequest | null;
  readonly hasMore: boolean;
  readonly nextEligiblePosition: PagePosition;
  readonly error: DataRequestError | null;
  readonly resourceLimit: DataLoadingResourceLimit | null;
}

export type DataProjectionEventDetail =
  | Readonly<{
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      attempt: number;
      status: 'complete';
    }>
  | Readonly<{
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      attempt: number;
      status: 'failed';
      error: { readonly message: string };
    }>;

export interface DataLoadingConfigErrorDetail {
  readonly issues: readonly DataLoadingConfigIssue[];
}

export type DataLoadingConfigErrorEventDetail = DataLoadingConfigErrorDetail;

export interface AcknowledgedCallbackAdditions {
  onDataRequestCancel?: (detail: DataRequestCancelNotification) => void;
  onDataProjection?: (detail: DataProjectionEventDetail) => void;
  onDataLoadingConfigError?: (detail: DataLoadingConfigErrorEventDetail) => void;
}

export interface EnhancedSelectAcknowledgedSurface {
  updateConfig(config: SelectInstanceConfig): void;
  startDataLoading(): void;
  getDataLoadingState(): DataLoadingStateSnapshot;
  completeDataRequest(completion: DataRequestCompletion): DataRequestCompletionResult;
}

// Extend the existing public event declarations without replacing their
// legacy fields or introducing a parallel event-name map.
declare module '../types.js' {
  interface SearchEventDetail {
    request?: SearchDataRequest;
  }

  interface LoadMoreEventDetail {
    request?: LoadMoreDataRequest;
  }

  interface SelectEventsDetailMap {
    dataRequestCancel: DataRequestCancelNotification;
    dataProjection: DataProjectionEventDetail;
    dataLoadingConfigError: DataLoadingConfigErrorEventDetail;
  }
}
