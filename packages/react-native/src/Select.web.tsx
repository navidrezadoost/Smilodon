import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
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
  containerStyle?: CSSProperties
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

type EnhancedSelectElement = HTMLElement & {
  setItems?: (items: SelectItem[]) => void
  setGroupedItems?: (groups: GroupedItem[]) => void
  setSelectedValues?: (values: Array<string | number>) => void
  getSelectedValues?: () => Array<string | number>
  updateConfig?: (config: unknown) => void
  open?: () => void
  close?: () => void
}

declare global {
  interface Window {
    __smilodonReactNativeCoreLoaded?: boolean
  }
}

function toArrayValue(value: SelectValue | undefined): Array<string | number> {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

async function ensureCoreLoaded() {
  if (typeof window === 'undefined') return
  if (window.__smilodonReactNativeCoreLoaded || window.customElements?.get('enhanced-select')) {
    window.__smilodonReactNativeCoreLoaded = true
    return
  }

  const runBundle = new Function(coreBundle)
  runBundle()
  window.__smilodonReactNativeCoreLoaded = true

  if (window.customElements?.whenDefined) {
    await window.customElements.whenDefined('enhanced-select')
  }
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const elementRef = useRef<EnhancedSelectElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [internalValue, setInternalValue] = useState<SelectValue | undefined>(defaultValue)
  const isControlled = value !== undefined

  const currentValue = isControlled ? value : internalValue

  const config = useMemo(() => ({
    searchable,
    placeholder,
    enabled: !disabled,
    virtualize: virtualized,
    selection: {
      mode: multiple ? 'multi' : 'single',
      maxSelections,
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
  }), [
    searchable,
    placeholder,
    disabled,
    virtualized,
    multiple,
    maxSelections,
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

  useImperativeHandle(ref, () => ({
    open: () => elementRef.current?.open?.(),
    close: () => elementRef.current?.close?.(),
    clear: () => elementRef.current?.setSelectedValues?.([]),
    setItems: (nextItems) => elementRef.current?.setItems?.(nextItems),
    setGroupedItems: (nextGroups) => elementRef.current?.setGroupedItems?.(nextGroups),
    setValue: (nextValue) => elementRef.current?.setSelectedValues?.(toArrayValue(nextValue)),
  }), [])

  useEffect(() => {
    let mounted = true

    const setup = async () => {
      await ensureCoreLoaded()
      if (!mounted || !containerRef.current) return

      let element = elementRef.current
      if (!element) {
        element = document.createElement('enhanced-select') as EnhancedSelectElement
        element.style.display = 'block'
        element.style.width = '100%'
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(element)
        elementRef.current = element
      }

      setIsReady(true)
    }

    void setup()

    return () => {
      mounted = false
      setIsReady(false)
    }
  }, [])

  useEffect(() => {
    if (!isReady) return
    const element = elementRef.current
    if (!element) return

    const handleSelect = (event: Event) => {
      const detail = (event as CustomEvent<{ item: SelectItem; index: number }>).detail
      onSelect?.(detail.item, detail.index)
    }

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ selectedValues: Array<string | number>; selectedItems: SelectItem[] }>).detail
      const nextValue = multiple ? detail.selectedValues : detail.selectedValues[0] ?? ''

      if (!isControlled) {
        setInternalValue(nextValue)
      }

      onChange?.(nextValue, detail.selectedItems)
    }

    const handleOpen = () => onOpen?.()
    const handleClose = () => onClose?.()
    const handleSearch = (event: Event) => {
      onSearch?.((event as CustomEvent<{ query: string }>).detail.query)
    }
    const handleLoadMore = (event: Event) => {
      onLoadMore?.((event as CustomEvent<{ page: number }>).detail.page)
    }
    const handleCreate = (event: Event) => {
      onCreate?.((event as CustomEvent<{ value: string }>).detail.value)
    }
    const handleClear = (event: Event) => {
      const detail = (event as CustomEvent<{ clearedSelection: boolean; clearedSearch: boolean }>).detail
      onClear?.(detail)
    }
    const handleDiagnostic = (event: Event) => {
      onDiagnostic?.((event as CustomEvent<DiagnosticEventDetail>).detail)
    }

    element.addEventListener('select', handleSelect)
    element.addEventListener('change', handleChange)
    element.addEventListener('open', handleOpen)
    element.addEventListener('close', handleClose)
    element.addEventListener('search', handleSearch)
    element.addEventListener('loadMore', handleLoadMore)
    element.addEventListener('create', handleCreate)
    element.addEventListener('clear', handleClear)
    element.addEventListener('diagnostic', handleDiagnostic)

    return () => {
      element.removeEventListener('select', handleSelect)
      element.removeEventListener('change', handleChange)
      element.removeEventListener('open', handleOpen)
      element.removeEventListener('close', handleClose)
      element.removeEventListener('search', handleSearch)
      element.removeEventListener('loadMore', handleLoadMore)
      element.removeEventListener('create', handleCreate)
      element.removeEventListener('clear', handleClear)
      element.removeEventListener('diagnostic', handleDiagnostic)
    }
  }, [isReady, isControlled, multiple, onChange, onClear, onClose, onCreate, onDiagnostic, onLoadMore, onOpen, onSearch, onSelect])

  useEffect(() => {
    if (!isReady) return
    const element = elementRef.current
    if (!element) return

    if (selectStyle) {
      Object.entries(selectStyle).forEach(([key, styleValue]) => {
        element.style.setProperty(key, styleValue)
      })
    }
  }, [isReady, selectStyle])

  useEffect(() => {
    if (!isReady) return
    const element = elementRef.current
    if (!element) return
    if (groupedItems?.length) {
      element.setGroupedItems?.(groupedItems)
    } else {
      element.setItems?.(items ?? [])
    }
  }, [groupedItems, isReady, items])

  useEffect(() => {
    if (!isReady) return
    const element = elementRef.current
    if (!element) return
    element.updateConfig?.(config)
  }, [config, isReady])

  useEffect(() => {
    if (!isReady) return
    const element = elementRef.current
    if (!element) return

    const nextValues = toArrayValue(currentValue)
    const currentSelected = element.getSelectedValues?.() ?? []
    const hasChanged =
      currentSelected.length !== nextValues.length ||
      !currentSelected.every((selectedValue, index) => selectedValue === nextValues[index])

    if (hasChanged) {
      element.setSelectedValues?.(nextValues)
    }
  }, [currentValue, isReady])

  return React.createElement('div', {
    ref: containerRef,
    style: {
      width: '100%',
      minHeight: 56,
      ...containerStyle,
    },
  })
})

export default Select
