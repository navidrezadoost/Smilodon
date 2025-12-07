import { defineComponent, h, onMounted, ref, watch, PropType } from 'vue';
import type {
  NativeSelectOptions,
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
} from '@native-select/core';

export interface NativeSelectProps extends Partial<NativeSelectOptions> {
  items?: unknown[];
  multi?: boolean;
  placement?: 'top' | 'bottom';
  estimatedItemHeight?: number;
  buffer?: number;
}

/**
 * Vue 3 adapter for @native-select/core
 * Thin wrapper that maps Vue props to Custom Element
 */
export const NativeSelect = defineComponent({
  name: 'NativeSelect',
  props: {
    items: {
      type: Array as PropType<unknown[]>,
      default: () => [],
    },
    multi: {
      type: Boolean,
      default: false,
    },
    placement: {
      type: String as PropType<'top' | 'bottom'>,
      default: 'bottom',
    },
    estimatedItemHeight: {
      type: Number,
      default: 40,
    },
    buffer: {
      type: Number,
      default: 5,
    },
  },
  emits: ['select', 'open', 'close', 'search'],
  setup(props, { emit, attrs }) {
    const elementRef = ref<any>(null);

    // Register custom element
    onMounted(async () => {
      if (typeof window !== 'undefined' && !customElements.get('native-select')) {
        const module = await import('@native-select/core');
        if (!customElements.get('native-select')) {
          customElements.define('native-select', module.NativeSelectElement);
        }
      }

      // Setup event listeners
      if (elementRef.value) {
        elementRef.value.addEventListener('select', (e: CustomEvent<SelectEventDetail>) => {
          emit('select', e.detail);
        });
        elementRef.value.addEventListener('open', (e: CustomEvent<OpenEventDetail>) => {
          emit('open', e.detail);
        });
        elementRef.value.addEventListener('close', (e: CustomEvent<CloseEventDetail>) => {
          emit('close', e.detail);
        });
        elementRef.value.addEventListener('search', (e: CustomEvent<SearchEventDetail>) => {
          emit('search', e.detail);
        });
      }
    });

    // Watch and sync props
    watch(
      () => props.items,
      (newItems) => {
        if (elementRef.value) {
          elementRef.value.items = newItems;
        }
      },
      { immediate: true }
    );

    watch(
      () => props.multi,
      (newMulti) => {
        if (elementRef.value) {
          elementRef.value.multi = newMulti;
        }
      },
      { immediate: true }
    );

    watch(
      () => props.placement,
      (newPlacement) => {
        if (elementRef.value) {
          elementRef.value.placement = newPlacement;
        }
      },
      { immediate: true }
    );

    watch(
      () => props.estimatedItemHeight,
      (newHeight) => {
        if (elementRef.value) {
          elementRef.value.estimatedItemHeight = newHeight;
        }
      },
      { immediate: true }
    );

    watch(
      () => props.buffer,
      (newBuffer) => {
        if (elementRef.value) {
          elementRef.value.buffer = newBuffer;
        }
      },
      { immediate: true }
    );

    return () =>
      h('native-select', {
        ref: elementRef,
        ...attrs,
      });
  },
});

/**
 * Composable for idiomatic Vue 3 usage
 */
export function useNativeSelect() {
  const elementRef = ref<any>(null);

  const focus = () => {
    elementRef.value?.focus();
  };

  const open = () => {
    elementRef.value?.open();
  };

  const close = () => {
    elementRef.value?.close();
  };

  const getSelectedIndices = () => {
    return elementRef.value?.selectedIndices || [];
  };

  const getSelectedItems = () => {
    return elementRef.value?.selectedItems || [];
  };

  const getActiveIndex = () => {
    return elementRef.value?.activeIndex || -1;
  };

  return {
    elementRef,
    focus,
    open,
    close,
    getSelectedIndices,
    getSelectedItems,
    getActiveIndex,
  };
}
