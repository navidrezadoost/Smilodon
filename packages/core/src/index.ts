export * from './types.js';
export type {
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  RemoveEventDetail,
  ErrorEventDetail,
  PageLoadedEventDetail,
  GroupedItem,
  RemoteConfig,
  Placement,
  Strategy,
  NativeSelectOptions,
  RendererHelpers,
  SelectEventsDetailMap,
  SelectEventName
} from './types.js';
export * from './renderers/contracts.js';
export * from './components/native-select.js';
export * from './components/enhanced-select.js';
export * from './components/select-option.js';
export * from './config/global-config.js';
export { FenwickTree } from './utils/fenwick-tree.js';
export { DOMPool } from './utils/dom-pool.js';
export { WorkerManager, getWorkerManager } from './utils/worker-manager.js';
export { PerformanceTelemetry, getTelemetry, measureAsync, measureSync } from './utils/telemetry.js';
export { Virtualizer } from './utils/virtualizer.js';

// Security & CSP utilities
export { 
  setHTMLSanitizer, 
  getHTMLSanitizer, 
  sanitizeHTML,
  createElement,
  setCSSProperties,
  CSPFeatures,
  detectEnvironment,
  containsSuspiciousPatterns,
  escapeHTML,
  escapeAttribute,
  validateTemplate,
  createTextNode,
  setTextContent
} from './utils/security.js';

export {
  applyClasses,
  toggleClass,
  setCustomProperties,
  getCustomProperty,
  removeCustomProperty,
  defaultTheme,
  applyDefaultTheme,
  shadowDOMStyles,
  injectShadowStyles,
  hasOverflowHiddenAncestor,
  warnCSPViolation
} from './utils/csp-styles.js';

export type { HTMLSanitizer, EnvironmentCapabilities } from './utils/security.js';

