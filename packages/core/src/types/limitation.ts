export type KnownLimitationId =
  | 'variableItemHeight'
  | 'builtInFetchPaginationApi'
  | 'virtualizationOverheadSmallLists'
  | 'runtimeModeSwitching'
  | 'legacyBrowserSupport'
  | 'webkitArchLinux';

export type LimitationControlMode = 'default' | 'suppress' | 'strict';

export interface LimitationPolicy {
  mode: LimitationControlMode;
  note?: string;
}
