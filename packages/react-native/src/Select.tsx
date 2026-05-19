import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import coreBundle from './generated/coreBundle.js'

export interface SelectItem {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
  [key: string]: unknown
}

export interface GroupedItem {
  label: string
  options: SelectItem[]
}

export interface DiagnosticEventDetail {
  channel: string
  message: string
  [key: string]: unknown
}

export interface LimitationPolicyMap {
  [key: string]: unknown
}

export interface TrackingSnapshot {
  events: unknown[]
  styles: unknown[]
  limitations: unknown[]
}

export interface SelectCapabilitiesReport {
  [key: string]: unknown
}

export interface LimitationState {
  [key: string]: unknown
}

export type SelectValue = string | number | Array<string | number>

export interface SelectHandle {
  open: () => void
  close: () => void
  clear: () => void
  setItems: (items: SelectItem[]) => void
  setGroupedItems: (groups: GroupedItem[]) => void
  setValue: (value: SelectValue | undefined) => void
}

export interface SelectProps {
  items?: SelectItem[]
  groupedItems?: GroupedItem[]
  value?: SelectValue
  defaultValue?: SelectValue
  multiple?: boolean
  searchable?: boolean
  placeholder?: string
  disabled?: boolean
  infiniteScroll?: boolean
  pageSize?: number
  virtualized?: boolean
  maxSelections?: number
  removeButtonIcon?: string
  disabledOptionBehavior?: {
    selectable?: boolean
    hoverable?: boolean
    focusable?: boolean
  }
  showSelectedIndicator?: boolean
  direction?: 'ltr' | 'rtl'
  clearable?: boolean
  clearSelectionOnClear?: boolean
  clearSearchOnClear?: boolean
  clearAriaLabel?: string
  clearIcon?: string
  expandable?: boolean
  trackingEnabled?: boolean
  trackEvents?: boolean
  trackStyling?: boolean
  trackLimitations?: boolean
  emitDiagnostics?: boolean
  trackingMaxEntries?: number
  limitationPolicies?: LimitationPolicyMap
  autoMitigateRuntimeModeSwitch?: boolean
  containerStyle?: StyleProp<ViewStyle>
  selectStyle?: Record<string, string>
  collapsedHeight?: number
  expandedHeight?: number
  onChange?: (value: SelectValue, items: SelectItem[]) => void
  onSelect?: (item: SelectItem, index: number) => void
  onOpen?: () => void
  onClose?: () => void
  onSearch?: (query: string) => void
  onLoadMore?: (page: number) => void
  onCreate?: (value: string) => void
  onClear?: (detail: { clearedSelection: boolean; clearedSearch: boolean }) => void
  onDiagnostic?: (detail: DiagnosticEventDetail) => void
}

type BridgePayload = {
  items?: SelectItem[]
  groupedItems?: GroupedItem[]
  value?: Array<string | number>
  config: Record<string, unknown>
  selectStyle?: Record<string, string>
}

const DEFAULT_COLLAPSED_HEIGHT = 64
const DEFAULT_EXPANDED_HEIGHT = 360

function toArrayValue(value: SelectValue | undefined): Array<string | number> {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function escapeForInjection(value: unknown) {
  return JSON.stringify(value)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\\$')
}

function createHtml(collapsedHeight: number) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
        height: ${collapsedHeight}px;
      }

      #root {
        min-height: ${collapsedHeight}px;
        padding: 0;
      }

      enhanced-select {
        display: block;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <enhanced-select id="smilodon-select"></enhanced-select>
    </div>
    <script>${coreBundle}</script>
    <script>
      (function () {
        const root = document.getElementById('root');
        const el = document.getElementById('smilodon-select');

        function post(message) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }
        }

        function setHeight(height) {
          document.documentElement.style.height = height + 'px';
          document.body.style.height = height + 'px';
          root.style.minHeight = height + 'px';
          post({ type: 'height', value: height });
        }

        function applyPayload(payload) {
          if (!payload) return;

          if (payload.selectStyle) {
            Object.entries(payload.selectStyle).forEach(([key, value]) => {
              el.style.setProperty(key, String(value));
            });
          }

          if (payload.groupedItems && payload.groupedItems.length) {
            el.setGroupedItems(payload.groupedItems);
          } else if (payload.items) {
            el.setItems(payload.items);
          }

          if (payload.value) {
            el.setSelectedValues(payload.value);
          } else {
            el.setSelectedValues([]);
          }

          el.updateConfig(payload.config || {});
        }

        window.__smilodonNativeBridge = {
          sync(payload) {
            applyPayload(payload);
          },
          open() {
            el.open();
          },
          close() {
            el.close();
          },
          clear() {
            el.setSelectedValues([]);
          }
        };

        el.addEventListener('select', function (event) {
          post({ type: 'select', detail: event.detail });
        });

        el.addEventListener('change', function (event) {
          post({ type: 'change', detail: event.detail });
        });

        el.addEventListener('open', function () {
          setHeight(window.__smilodonExpandedHeight || ${DEFAULT_EXPANDED_HEIGHT});
          post({ type: 'open' });
        });

        el.addEventListener('close', function () {
          setHeight(window.__smilodonCollapsedHeight || ${DEFAULT_COLLAPSED_HEIGHT});
          post({ type: 'close' });
        });

        el.addEventListener('search', function (event) {
          post({ type: 'search', detail: event.detail });
        });

        el.addEventListener('loadMore', function (event) {
          post({ type: 'loadMore', detail: event.detail });
        });

        el.addEventListener('create', function (event) {
          post({ type: 'create', detail: event.detail });
        });

        el.addEventListener('clear', function (event) {
          post({ type: 'clear', detail: event.detail });
        });

        el.addEventListener('diagnostic', function (event) {
          post({ type: 'diagnostic', detail: event.detail });
        });

        Promise.resolve(customElements.whenDefined('enhanced-select')).then(function () {
          setHeight(window.__smilodonCollapsedHeight || ${DEFAULT_COLLAPSED_HEIGHT});
          post({ type: 'ready' });
        });
      })();
    </script>
  </body>
</html>`
}

const Select = forwardRef<SelectHandle, SelectProps>(function Select(
  {
    items,
    groupedItems,
    value,
    defaultValue,
    multiple = false,
    searchable = false,
    placeholder,
    disabled = false,
    infiniteScroll = false,
    pageSize = 50,
    virtualized = true,
    maxSelections,
    removeButtonIcon,
    disabledOptionBehavior,
    showSelectedIndicator = true,
    direction,
    clearable = false,
    clearSelectionOnClear = true,
    clearSearchOnClear = true,
    clearAriaLabel,
    clearIcon,
    expandable,
    trackingEnabled = false,
    trackEvents = true,
    trackStyling = true,
    trackLimitations = true,
    emitDiagnostics = false,
    trackingMaxEntries = 200,
    limitationPolicies,
    autoMitigateRuntimeModeSwitch = true,
    containerStyle,
    selectStyle,
    collapsedHeight = DEFAULT_COLLAPSED_HEIGHT,
    expandedHeight = DEFAULT_EXPANDED_HEIGHT,
    onChange,
    onSelect,
    onOpen,
    onClose,
    onSearch,
    onLoadMore,
    onCreate,
    onClear,
    onDiagnostic,
  },
  ref
) {
  const webViewRef = useRef<WebView>(null)
  const [isReady, setIsReady] = useState(false)
  const [webViewHeight, setWebViewHeight] = useState(collapsedHeight)
  const [internalValue, setInternalValue] = useState<SelectValue | undefined>(defaultValue)

  const currentValue = value !== undefined ? value : internalValue

  const bridgePayload = useMemo<BridgePayload>(() => ({
    items,
    groupedItems,
    value: toArrayValue(currentValue),
    selectStyle,
    config: {
      searchable,
      placeholder,
      enabled: !disabled,
      virtualize: virtualized,
      direction,
      selection: {
        mode: multiple ? 'multi' : 'single',
        maxSelections,
        removeButtonIcon,
        disabledOptionBehavior,
        showSelectedIndicator,
      },
      infiniteScroll: {
        enabled: infiniteScroll,
        pageSize,
      },
      expandable: {
        enabled: expandable,
      },
      clearControl: {
        enabled: clearable,
        clearSelection: clearSelectionOnClear,
        clearSearch: clearSearchOnClear,
        ariaLabel: clearAriaLabel,
        icon: clearIcon,
      },
      tracking: {
        enabled: trackingEnabled,
        events: trackEvents,
        styling: trackStyling,
        limitations: trackLimitations,
        emitDiagnostics,
        maxEntries: trackingMaxEntries,
      },
      limitations: {
        policies: limitationPolicies,
        autoMitigateRuntimeModeSwitch,
      },
    },
  }), [
    items,
    groupedItems,
    currentValue,
    selectStyle,
    searchable,
    placeholder,
    disabled,
    virtualized,
    multiple,
    maxSelections,
    removeButtonIcon,
    disabledOptionBehavior,
    showSelectedIndicator,
    direction,
    infiniteScroll,
    pageSize,
    expandable,
    clearable,
    clearSelectionOnClear,
    clearSearchOnClear,
    clearAriaLabel,
    clearIcon,
    trackingEnabled,
    trackEvents,
    trackStyling,
    trackLimitations,
    emitDiagnostics,
    trackingMaxEntries,
    limitationPolicies,
    autoMitigateRuntimeModeSwitch,
  ])

  const syncToWebView = useCallback((payload: BridgePayload) => {
    const js = `
      window.__smilodonCollapsedHeight = ${collapsedHeight};
      window.__smilodonExpandedHeight = ${expandedHeight};
      window.__smilodonNativeBridge && window.__smilodonNativeBridge.sync(${escapeForInjection(payload)});
      true;
    `
    webViewRef.current?.injectJavaScript(js)
  }, [collapsedHeight, expandedHeight])

  useEffect(() => {
    if (!isReady) return
    syncToWebView(bridgePayload)
  }, [bridgePayload, isReady, syncToWebView])

  useImperativeHandle(ref, () => ({
    open: () => {
      webViewRef.current?.injectJavaScript('window.__smilodonNativeBridge && window.__smilodonNativeBridge.open(); true;')
    },
    close: () => {
      webViewRef.current?.injectJavaScript('window.__smilodonNativeBridge && window.__smilodonNativeBridge.close(); true;')
    },
    clear: () => {
      webViewRef.current?.injectJavaScript('window.__smilodonNativeBridge && window.__smilodonNativeBridge.clear(); true;')
    },
    setItems: (nextItems) => {
      syncToWebView({ ...bridgePayload, items: nextItems, groupedItems: undefined })
    },
    setGroupedItems: (nextGroups) => {
      syncToWebView({ ...bridgePayload, groupedItems: nextGroups, items: undefined })
    },
    setValue: (nextValue) => {
      syncToWebView({ ...bridgePayload, value: toArrayValue(nextValue) })
    },
  }), [bridgePayload, syncToWebView])

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data)
      switch (message.type) {
        case 'ready':
          setIsReady(true)
          syncToWebView(bridgePayload)
          return
        case 'height':
          if (typeof message.value === 'number') {
            setWebViewHeight(message.value)
          }
          return
        case 'select':
          onSelect?.(message.detail.item as SelectItem, message.detail.index as number)
          return
        case 'change': {
          const selectedValues = message.detail.selectedValues as Array<string | number>
          const selectedItems = message.detail.selectedItems as SelectItem[]
          const nextValue = multiple ? selectedValues : selectedValues[0] ?? ''
          if (value === undefined) {
            setInternalValue(nextValue)
          }
          onChange?.(nextValue, selectedItems)
          return
        }
        case 'open':
          onOpen?.()
          return
        case 'close':
          onClose?.()
          return
        case 'search':
          onSearch?.(message.detail.query as string)
          return
        case 'loadMore':
          onLoadMore?.(message.detail.page as number)
          return
        case 'create':
          onCreate?.(message.detail.value as string)
          return
        case 'clear':
          onClear?.({
            clearedSelection: Boolean(message.detail.clearedSelection),
            clearedSearch: Boolean(message.detail.clearedSearch),
          })
          return
        case 'diagnostic':
          onDiagnostic?.(message.detail as DiagnosticEventDetail)
          return
        default:
          return
      }
    } catch {
      return
    }
  }, [bridgePayload, multiple, onChange, onClear, onClose, onCreate, onDiagnostic, onLoadMore, onOpen, onSearch, onSelect, syncToWebView, value])

  const html = useMemo(() => createHtml(collapsedHeight), [collapsedHeight])

  return (
    <View style={[styles.container, { height: webViewHeight }, containerStyle]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        scrollEnabled={false}
        nestedScrollEnabled={false}
        onMessage={onMessage}
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
})

export default Select
