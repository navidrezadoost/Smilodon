import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/vue';
import { waitFor } from '@testing-library/dom';
import { defineComponent, onMounted, ref } from 'vue';
import { Select } from '@smilodon/vue';
import { basicItems } from './fixtures/test-data';

describe('Vue Adapter Contract Tests', () => {
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
    expect((api.getTrackingSnapshot() ?? element.getTrackingSnapshot?.()).events).toHaveLength(0);

    api.setLimitationPolicies({ runtimeModeSwitching: { mode: 'strict' } });
    const updated = (api.getKnownLimitations() ?? element.getKnownLimitations?.() ?? [])
      .find((item: any) => item.id === 'runtimeModeSwitching');
    expect(updated?.mode).toBe('strict');

    unmount();
  });
});
