import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { waitFor } from '@testing-library/dom';
import '@smilodon/core';
import { Select } from '@smilodon/svelte';
import { basicItems } from './fixtures/test-data';

describe('Svelte Adapter Contract Tests', () => {
  it('emits diagnostic events and supports runtime tracking/limitations APIs', async () => {
    const { component, container, unmount } = render(Select as any, {
      props: {
        items: basicItems,
        trackingEnabled: true,
        emitDiagnostics: true,
      },
    });

    const element = container.querySelector('enhanced-select') as any;
    const onNativeDiagnostic = vi.fn();

    element.addEventListener('diagnostic', (event: Event) => {
      onNativeDiagnostic((event as CustomEvent).detail);
    });

    await waitFor(() => {
      expect(typeof (component as any).getCapabilities).toBe('function');
    });

    await waitFor(() => {
      expect(typeof element?.updateConfig).toBe('function');
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

    const capabilities = (component as any).getCapabilities() ?? element.getCapabilities?.();
    expect(capabilities?.events?.diagnosticEvent).toBe(true);

    const limitations = (component as any).getKnownLimitations() ?? element.getKnownLimitations?.() ?? [];
    expect(limitations.some((item: any) => item.id === 'runtimeModeSwitching')).toBe(true);

    await waitFor(() => {
      const snapshot = (component as any).getTrackingSnapshot() ?? element.getTrackingSnapshot?.();
      expect(snapshot.styles.length).toBeGreaterThan(0);
    });

    (component as any).clearTracking('event');
    expect(((component as any).getTrackingSnapshot() ?? element.getTrackingSnapshot?.()).events).toHaveLength(0);

    (component as any).setLimitationPolicies({ runtimeModeSwitching: { mode: 'strict' } });
    const updated = (component as any)
      .getKnownLimitations()
      .find((item: any) => item.id === 'runtimeModeSwitching');
    expect(updated?.mode).toBe('strict');

    unmount();
  });
});
