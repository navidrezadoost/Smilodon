import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/vue';
import { waitFor } from '@testing-library/dom';
import { defineComponent, onMounted, ref } from 'vue';
import { Select } from '@smilodon/vue';
import { basicItems } from './fixtures/test-data';

describe('Vue Adapter Contract Tests', () => {
  it('forwards option selection through the Vue select event with item and index', async () => {
    const onSelect = vi.fn();
    const Harness = defineComponent({
      components: { Select },
      setup() {
        return { items: basicItems, onSelect };
      },
      template: '<Select :items="items" @select="onSelect" />',
    });
    const { container, unmount } = render(Harness);
    const element = container.querySelector('enhanced-select') as any;

    await waitFor(() => {
      expect(element?._state?.loadedItems).toHaveLength(basicItems.length);
    });
    element.open();
    const option = element.shadowRoot?.querySelector('[part="option"][data-index="0"]') as HTMLElement | null;
    expect(option).toBeTruthy();
    option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(basicItems[0], 0);
    });
    unmount();
  });

  it('forwards selection, syncs the controlled model, and removes its listener on unmount', async () => {
    const onSelect = vi.fn();
    const props = { items: basicItems, modelValue: '1', onSelect };
    const { container, rerender, unmount } = render(Select, { props });
    const element = container.querySelector('enhanced-select') as any;

    await waitFor(() => expect(element?.getSelectedValues?.()).toEqual(['1']));

    await rerender({ ...props, modelValue: '2' });
    await waitFor(() => expect(element?.getSelectedValues?.()).toEqual(['2']));

    element.open();
    const option = element.shadowRoot?.querySelector('[part="option"][data-index="0"]') as HTMLElement | null;
    expect(option).toBeTruthy();
    option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(basicItems[0], 0));

    unmount();
    element.dispatchEvent(new CustomEvent('select', {
      detail: { item: basicItems[1], index: 1, value: '2', label: 'Banana', selected: true },
    }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('emits diagnostic event and exposes runtime control methods', async () => {
    const onNativeDiagnostic = vi.fn();
    let api: any = null;

    const Harness = defineComponent({
      components: { Select },
      setup() {
        const selectRef = ref<any>(null);

        onMounted(() => {
          api = selectRef.value;
        });

        return {
          selectRef,
          items: basicItems,
        };
      },
      template: `
        <Select
          ref="selectRef"
          :items="items"
          :trackingEnabled="true"
          :emitDiagnostics="true"
        />
      `,
    });

    const { container, unmount } = render(Harness);

    const element = container.querySelector('enhanced-select') as any;

    await waitFor(() => {
      expect(api).toBeTruthy();
      expect(typeof api.getCapabilities).toBe('function');
    });

    await waitFor(() => {
      expect(typeof element?.updateConfig).toBe('function');
    });

    element.addEventListener('diagnostic', (event: Event) => {
      onNativeDiagnostic((event as CustomEvent).detail);
    });

    element.updateConfig({
      tracking: {
        enabled: true,
        events: true,
        styling: true,
        limitations: true,
        emitDiagnostics: true,
        maxEntries: 200,
      },
    });

    element.classMap = { selected: 'contract-selected' };

    await waitFor(() => {
      expect(onNativeDiagnostic).toHaveBeenCalled();
    });

    const diagnostics = onNativeDiagnostic.mock.calls.map((call) => call[0]);
    const hasStyleDiagnostic = diagnostics.some(
      (detail) => detail?.source === 'style'
    );
    expect(hasStyleDiagnostic).toBe(true);

    const capabilities = api.getCapabilities() ?? element.getCapabilities?.();
    expect(capabilities?.events?.diagnosticEvent).toBe(true);

    const limitations = api.getKnownLimitations() ?? element.getKnownLimitations?.() ?? [];
    expect(limitations.some((item: any) => item.id === 'runtimeModeSwitching')).toBe(true);

    await waitFor(() => {
      const snapshot = api.getTrackingSnapshot() ?? element.getTrackingSnapshot?.();
      expect(snapshot.styles.length).toBeGreaterThan(0);
    });

    api.clearTracking('event');
    const trackingSnapshot = api.getTrackingSnapshot() ?? element.getTrackingSnapshot?.();
    expect(trackingSnapshot?.events).toHaveLength(0);

    api.setLimitationPolicies({ runtimeModeSwitching: { mode: 'strict' } });
    const updated = (api.getKnownLimitations() ?? element.getKnownLimitations?.() ?? [])
      .find((item: any) => item.id === 'runtimeModeSwitching');
    expect(updated?.mode).toBe('strict');

    unmount();
  });
});
