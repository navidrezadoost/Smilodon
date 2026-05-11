import { createEffect, createSignal, onCleanup, onMount, on, type JSX } from 'solid-js'
import { render } from 'solid-js/web'
import type {
  SelectEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  ClearEventDetail,
  GroupedItem,
  ClassMap,
  RendererHelpers,
  DiagnosticEventDetail,
  LimitationPolicyMap,
  TrackingSnapshot,
  SelectCapabilitiesReport,
  LimitationState,
} from '@smilodon/core'

export interface SelectItem {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
  [key: string]: unknown
}

type SelectValue = string | number | Array<string | number>

type EnhancedSelectElement = HTMLElement & {
  setItems?: (items: SelectItem[]) => void
  setGroupedItems?: (groups: GroupedItem[]) => void
  getSelectedItems?: () => SelectItem[]
  getSelectedValues?: () => Array<string | number>
  setSelectedValues?: (values: Array<string | number>) => void
  updateConfig?: (config: unknown) => void
  open?: () => void
  close?: () => void
  optionRenderer?: ((item: SelectItem, index: number, helpers?: RendererHelpers) => HTMLElement) | undefined
  groupHeaderRenderer?: ((group: GroupedItem, index: number) => HTMLElement) | undefined
  classMap?: ClassMap | undefined
  getCapabilities?: () => SelectCapabilitiesReport
  getKnownLimitations?: () => LimitationState[]
  getTrackingSnapshot?: () => TrackingSnapshot
  clearTracking?: (source?: 'event' | 'style' | 'limitation' | 'all') => void
  setLimitationPolicies?: (policies: LimitationPolicyMap) => void
}

export interface SelectHandle {
  focus: () => void
  open: () => void
  close: () => void
  getSelectedItems: () => SelectItem[]
  getSelectedValues: () => Array<string | number>
  setItems: (items: SelectItem[]) => void
  setGroupedItems: (groups: GroupedItem[]) => void
  clear: () => void
  getCapabilities: () => SelectCapabilitiesReport | undefined
  getKnownLimitations: () => LimitationState[]
  getTrackingSnapshot: () => TrackingSnapshot
  clearTracking: (source?: 'event' | 'style' | 'limitation' | 'all') => void
  setLimitationPolicies: (policies: LimitationPolicyMap) => void
}

export interface SelectProps {
  items?: SelectItem[]
  groupedItems?: GroupedItem[]
  groupHeaderRenderer?: (group: GroupedItem, index: number) => JSX.Element
  value?: SelectValue
  defaultValue?: SelectValue
  multiple?: boolean
  searchable?: boolean
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: boolean
  infiniteScroll?: boolean
  pageSize?: number
  virtualized?: boolean
  maxSelections?: number
  placement?: 'bottom' | 'top' | 'auto'
  class?: string
  className?: string
  style?: JSX.CSSProperties
  expandable?: boolean
  clearable?: boolean
  clearSelectionOnClear?: boolean
  clearSearchOnClear?: boolean
  clearAriaLabel?: string
  clearIcon?: string
  classMap?: ClassMap
  optionRenderer?: (item: SelectItem, index: number, helpers?: RendererHelpers) => HTMLElement
  customRenderer?: (item: SelectItem, index: number) => JSX.Element
  trackingEnabled?: boolean
  trackEvents?: boolean
  trackStyling?: boolean
  trackLimitations?: boolean
  emitDiagnostics?: boolean
  trackingMaxEntries?: number
  limitationPolicies?: LimitationPolicyMap
  autoMitigateRuntimeModeSwitch?: boolean
  onChange?: (value: SelectValue, items: SelectItem[]) => void
  onSelect?: (item: SelectItem, index: number) => void
  onOpen?: () => void
  onClose?: () => void
  onSearch?: (query: string) => void
  onLoadMore?: (page: number) => void
  onCreate?: (value: string) => void
  onClear?: (detail: { clearedSelection: boolean; clearedSearch: boolean }) => void
  onDiagnostic?: (detail: DiagnosticEventDetail) => void
  ref?: (handle: SelectHandle) => void
}

const defaultProps = {
  items: () => [] as SelectItem[],
  multiple: false,
  searchable: false,
  disabled: false,
  required: false,
  error: false,
  infiniteScroll: false,
  pageSize: 50,
  virtualized: true,
  placement: 'auto' as const,
  clearable: false,
  clearSelectionOnClear: true,
  clearSearchOnClear: true,
  trackingEnabled: false,
  trackEvents: true,
  trackStyling: true,
  trackLimitations: true,
  emitDiagnostics: false,
  trackingMaxEntries: 200,
  autoMitigateRuntimeModeSwitch: true,
}

export default function Select(rawProps: SelectProps) {
  const props = {
    ...defaultProps,
    ...rawProps,
    items: rawProps.items ?? defaultProps.items(),
  }

  let selectRef: EnhancedSelectElement | undefined
  const [isElementReady, setIsElementReady] = createSignal(false)
  const [internalValue, setInternalValue] = createSignal<SelectValue | undefined>(props.defaultValue)
  const [resolvedOptionRenderer, setResolvedOptionRenderer] = createSignal<SelectProps['optionRenderer'] | ((item: SelectItem, index: number, helpers?: RendererHelpers) => HTMLElement) | undefined>()
  const customRendererCache = new Map<number, { container: HTMLDivElement; dispose?: () => void }>()
  const groupHeaderDisposers = new Set<() => void>()

  const isControlled = () => rawProps.value !== undefined
  const currentValue = () => (isControlled() ? rawProps.value : internalValue())

  const toArrayValue = (value: SelectValue | undefined) =>
    value === undefined ? [] : Array.isArray(value) ? value : [value]

  const cleanupCustomRendererCache = () => {
    for (const entry of customRendererCache.values()) {
      entry.dispose?.()
      entry.container.remove()
    }
    customRendererCache.clear()
  }

  const cleanupGroupHeaderRenderers = () => {
    for (const dispose of groupHeaderDisposers) dispose()
    groupHeaderDisposers.clear()
  }

  const safeCall = (fn: (el: EnhancedSelectElement) => void) => {
    if (!selectRef || !isElementReady()) return
    fn(selectRef)
  }

  const syncItems = (el: EnhancedSelectElement) => {
    if (rawProps.groupedItems?.length) {
      el.setGroupedItems?.(rawProps.groupedItems)
      return
    }

    if (!rawProps.items?.length) {
      el.setItems?.([])
      return
    }

    const first = rawProps.items[0]
    if (first && first.group !== undefined) {
      const grouped = Array.from(
        rawProps.items.reduce((map, item) => {
          const groupName = item.group ?? 'Ungrouped'
          const group = map.get(groupName)
          if (group) {
            group.options.push(item)
          } else {
            map.set(groupName, { label: groupName, options: [item] })
          }
          return map
        }, new Map<string, GroupedItem>()).values()
      )
      el.setGroupedItems?.(grouped)
      return
    }

    el.setItems?.(rawProps.items)
  }

  createEffect(
    on(
      [() => !!rawProps.optionRenderer, () => !!rawProps.customRenderer],
      ([hasOptionRenderer, hasCustomRenderer]: [boolean, boolean]) => {
        if (hasOptionRenderer) {
          setResolvedOptionRenderer(() => (item: SelectItem, index: number, helpers?: RendererHelpers) =>
            rawProps.optionRenderer?.(item, index, helpers as RendererHelpers) ?? document.createElement('div')
          )
          return
        }

        if (hasCustomRenderer) {
          setResolvedOptionRenderer(() => (item: SelectItem, index: number) => {
            let entry = customRendererCache.get(index)
            if (!entry) {
              entry = { container: document.createElement('div') }
              customRendererCache.set(index, entry)
            }

            entry.dispose?.()
            entry.dispose = render(() => rawProps.customRenderer?.(item, index) ?? null, entry.container)
            return entry.container
          })
          return
        }

        cleanupCustomRendererCache()
        setResolvedOptionRenderer(undefined)
      },
      { defer: false }
    )
  )

  createEffect(() => {
    const ready = isElementReady()
    const renderer = resolvedOptionRenderer()
    if (!ready) return
    safeCall((el) => {
      el.optionRenderer = renderer
    })
  })

  createEffect(() => {
    const ready = isElementReady()
    const classMap = rawProps.classMap
    if (!ready) return

    safeCall((el) => {
      el.classMap = classMap
    })
  })

  createEffect(() => {
    const items = rawProps.items
    const groups = rawProps.groupedItems
    const totalItems = groups?.length
      ? groups.reduce((count, group) => count + group.options.length, 0)
      : items?.length ?? 0

    for (const [index, entry] of customRendererCache.entries()) {
      if (index >= totalItems) {
        entry.dispose?.()
        entry.container.remove()
        customRendererCache.delete(index)
      }
    }
  })

  createEffect(() => {
    if (!isElementReady()) return
    safeCall((el) => syncItems(el))
  })

  createEffect(() => {
    const ready = isElementReady()
    const renderer = rawProps.groupHeaderRenderer
    if (!ready) return

    safeCall((el) => {
      cleanupGroupHeaderRenderers()
      if (!renderer) {
        el.groupHeaderRenderer = undefined
        return
      }

      el.groupHeaderRenderer = (group: GroupedItem, index: number) => {
        const container = document.createElement('div')
        const dispose = render(() => renderer(group, index), container)
        groupHeaderDisposers.add(dispose)
        return container
      }
    })
  })

  createEffect(() => {
    const ready = isElementReady()
    const placement = rawProps.placement ?? props.placement
    if (!ready || !selectRef) return
    if (placement) {
      selectRef.setAttribute('placement', placement)
    }
  })

  createEffect(() => {
    const ready = isElementReady()
    const value = currentValue()
    if (!ready || value === undefined) return

    safeCall((el) => {
      const currentSelected = el.getSelectedValues?.() ?? []
      const nextValues = toArrayValue(value)
      const hasChanged =
        currentSelected.length !== nextValues.length ||
        !currentSelected.every((selectedValue, index) => selectedValue === nextValues[index])

      if (hasChanged) {
        el.setSelectedValues?.(nextValues)
      }
    })
  })

  createEffect(() => {
    const ready = isElementReady()
    if (!ready) return

    safeCall((el) => {
      el.updateConfig?.({
        searchable: rawProps.searchable ?? props.searchable,
        placeholder: rawProps.placeholder,
        enabled: !(rawProps.disabled ?? props.disabled),
        virtualize: rawProps.virtualized ?? props.virtualized,
        selection: {
          mode: (rawProps.multiple ?? props.multiple) ? 'multi' : 'single',
          maxSelections: rawProps.maxSelections,
        },
        infiniteScroll: {
          enabled: rawProps.infiniteScroll ?? props.infiniteScroll,
          pageSize: rawProps.pageSize ?? props.pageSize,
        },
        expandable: {
          enabled: rawProps.expandable,
        },
        clearControl: {
          enabled: rawProps.clearable ?? props.clearable,
          clearSelection: rawProps.clearSelectionOnClear ?? props.clearSelectionOnClear,
          clearSearch: rawProps.clearSearchOnClear ?? props.clearSearchOnClear,
          ariaLabel: rawProps.clearAriaLabel,
          icon: rawProps.clearIcon,
        },
        tracking: {
          enabled: rawProps.trackingEnabled ?? props.trackingEnabled,
          events: rawProps.trackEvents ?? props.trackEvents,
          styling: rawProps.trackStyling ?? props.trackStyling,
          limitations: rawProps.trackLimitations ?? props.trackLimitations,
          emitDiagnostics: rawProps.emitDiagnostics ?? props.emitDiagnostics,
          maxEntries: rawProps.trackingMaxEntries ?? props.trackingMaxEntries,
        },
        limitations: {
          policies: rawProps.limitationPolicies,
          autoMitigateRuntimeModeSwitch:
            rawProps.autoMitigateRuntimeModeSwitch ?? props.autoMitigateRuntimeModeSwitch,
        },
      })
    })
  })

  const waitForUpgrade = async () => {
    if (typeof window === 'undefined') return

    if (!customElements.get('enhanced-select')) {
      await import('@smilodon/core')
    }

    if (!selectRef) return

    try {
      await customElements.whenDefined('enhanced-select')
    } catch {
      // ignore
    }

    for (let index = 0; index < 5; index += 1) {
      if (selectRef && typeof selectRef.setItems === 'function') {
        setIsElementReady(true)
        if (resolvedOptionRenderer()) {
          selectRef.optionRenderer = resolvedOptionRenderer()
        }
        if (rawProps.classMap) {
          selectRef.classMap = rawProps.classMap
        }
        return
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }

    setIsElementReady(Boolean(selectRef && typeof selectRef.setItems === 'function'))
    if (selectRef && resolvedOptionRenderer()) {
      selectRef.optionRenderer = resolvedOptionRenderer()
    }
    if (selectRef && rawProps.classMap) {
      selectRef.classMap = rawProps.classMap
    }
  }

  const handleSelect = (event: Event) => {
    const customEvent = event as CustomEvent<SelectEventDetail>
    rawProps.onSelect?.(customEvent.detail.item as SelectItem, customEvent.detail.index)
  }

  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent<ChangeEventDetail>
    const values = customEvent.detail.selectedValues as Array<string | number>
    const nextValue = (rawProps.multiple ?? props.multiple) ? values : values[0] ?? ''

    if (!isControlled()) {
      setInternalValue(nextValue)
    }

    rawProps.onChange?.(nextValue, customEvent.detail.selectedItems as SelectItem[])
  }

  const handleSearch = (event: Event) => {
    const customEvent = event as CustomEvent<SearchEventDetail>
    rawProps.onSearch?.(customEvent.detail.query)
  }

  const handleLoadMore = (event: Event) => {
    const customEvent = event as CustomEvent<LoadMoreEventDetail>
    rawProps.onLoadMore?.(customEvent.detail.page)
  }

  const handleCreate = (event: Event) => {
    const customEvent = event as CustomEvent<{ value: string }>
    rawProps.onCreate?.(customEvent.detail.value)
  }

  const handleClear = (event: Event) => {
    const customEvent = event as CustomEvent<ClearEventDetail>
    rawProps.onClear?.({
      clearedSelection: customEvent.detail.clearedSelection,
      clearedSearch: customEvent.detail.clearedSearch,
    })
  }

  const handleDiagnostic = (event: Event) => {
    const customEvent = event as CustomEvent<DiagnosticEventDetail>
    rawProps.onDiagnostic?.(customEvent.detail)
  }

  const handleOpen = () => rawProps.onOpen?.()
  const handleClose = () => rawProps.onClose?.()

  const handle: SelectHandle = {
    focus: () => selectRef?.focus(),
    open: () => selectRef?.open?.(),
    close: () => selectRef?.close?.(),
    getSelectedItems: () => selectRef?.getSelectedItems?.() ?? [],
    getSelectedValues: () => selectRef?.getSelectedValues?.() ?? [],
    setItems: (items) => selectRef?.setItems?.(items),
    setGroupedItems: (groups) => selectRef?.setGroupedItems?.(groups),
    clear: () => {
      selectRef?.setSelectedValues?.([])
      if (!isControlled()) {
        setInternalValue((rawProps.multiple ?? props.multiple) ? [] : '')
      }
      rawProps.onChange?.((rawProps.multiple ?? props.multiple) ? [] : '', [])
    },
    getCapabilities: () => selectRef?.getCapabilities?.(),
    getKnownLimitations: () => selectRef?.getKnownLimitations?.() ?? [],
    getTrackingSnapshot: () => selectRef?.getTrackingSnapshot?.() ?? { events: [], styles: [], limitations: [] },
    clearTracking: (source) => selectRef?.clearTracking?.(source),
    setLimitationPolicies: (policies) => selectRef?.setLimitationPolicies?.(policies),
  }

  onMount(async () => {
    await waitForUpgrade()
    if (!selectRef || !isElementReady()) return

    props.ref?.(handle)

    syncItems(selectRef)

    const initialValues = toArrayValue(currentValue())
    if (initialValues.length) {
      selectRef.setSelectedValues?.(initialValues)
    }

    selectRef.addEventListener('select', handleSelect as EventListener)
    selectRef.addEventListener('change', handleChange as EventListener)
    selectRef.addEventListener('open', handleOpen as EventListener)
    selectRef.addEventListener('close', handleClose as EventListener)
    selectRef.addEventListener('search', handleSearch as EventListener)
    selectRef.addEventListener('loadMore', handleLoadMore as EventListener)
    selectRef.addEventListener('create', handleCreate as EventListener)
    selectRef.addEventListener('clear', handleClear as EventListener)
    selectRef.addEventListener('diagnostic', handleDiagnostic as EventListener)
  })

  onCleanup(() => {
    cleanupCustomRendererCache()
    cleanupGroupHeaderRenderers()

    if (!selectRef) return

    selectRef.removeEventListener('select', handleSelect as EventListener)
    selectRef.removeEventListener('change', handleChange as EventListener)
    selectRef.removeEventListener('open', handleOpen as EventListener)
    selectRef.removeEventListener('close', handleClose as EventListener)
    selectRef.removeEventListener('search', handleSearch as EventListener)
    selectRef.removeEventListener('loadMore', handleLoadMore as EventListener)
    selectRef.removeEventListener('create', handleCreate as EventListener)
    selectRef.removeEventListener('clear', handleClear as EventListener)
    selectRef.removeEventListener('diagnostic', handleDiagnostic as EventListener)
  })

  return (
    <enhanced-select
      ref={(element: Element) => {
        selectRef = element as EnhancedSelectElement
      }}
      class={rawProps.class ?? rawProps.className}
      style={rawProps.style as JSX.CSSProperties}
    />
  )
}
