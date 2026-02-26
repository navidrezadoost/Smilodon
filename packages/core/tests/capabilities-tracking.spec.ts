import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Capabilities, Tracking and Limitations', () => {
  let el: any;

  beforeEach(async () => {
    el = document.createElement('enhanced-select') as any;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  afterEach(() => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  it('reports capabilities and known limitations', () => {
    const capabilities = el.getCapabilities?.();
    expect(capabilities).toBeTruthy();
    expect(capabilities?.events?.diagnosticEvent).toBe(true);
    expect(capabilities?.styling?.classMap).toBe(true);

    const limitations = el.getKnownLimitations?.() || [];
    expect(Array.isArray(limitations)).toBe(true);
    expect(limitations.some((item: any) => item.id === 'runtimeModeSwitching')).toBe(true);
  });

  it('tracks events and emits diagnostic payloads when enabled', async () => {
    const diagnosticSpy = vi.fn();
    el.addEventListener('diagnostic', (event: Event) => {
      diagnosticSpy((event as CustomEvent).detail);
    });

    el.updateConfig?.({
      tracking: {
        enabled: true,
        events: true,
        styling: true,
        limitations: true,
        emitDiagnostics: true,
        maxEntries: 200,
      },
    });

    el.open?.();

    await new Promise((resolve) => setTimeout(resolve, 0));

    const snapshot = el.getTrackingSnapshot?.();
    expect(snapshot?.events?.length ?? 0).toBeGreaterThan(0);

    const hasOpenTracked = (snapshot?.events || []).some(
      (entry: any) => entry.source === 'event' && entry.name === 'open'
    );
    expect(hasOpenTracked).toBe(true);

    expect(diagnosticSpy).toHaveBeenCalled();
  });

  it('applies limitation policies and clears tracking buckets', () => {
    el.updateConfig?.({
      tracking: {
        enabled: true,
        events: true,
        styling: true,
        limitations: true,
        emitDiagnostics: false,
        maxEntries: 200,
      },
    });

    el.setLimitationPolicies?.({
      runtimeModeSwitching: { mode: 'strict', note: 'unit-test' },
    });

    const limitations = el.getKnownLimitations?.() || [];
    const runtimeMode = limitations.find((item: any) => item.id === 'runtimeModeSwitching');
    expect(runtimeMode?.mode).toBe('strict');

    const beforeClear = el.getTrackingSnapshot?.();
    expect(beforeClear?.limitations?.length ?? 0).toBeGreaterThan(0);

    el.clearTracking?.('limitation');
    const afterClear = el.getTrackingSnapshot?.();
    expect(afterClear?.limitations || []).toHaveLength(0);
  });

  it('mitigates runtime mode switching by clearing selection state', async () => {
    el.setItems?.([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);

    await el.setSelectedValues?.(['a']);
    const before = el.getSelectedValues?.() || [];
    expect(before).toContain('a');

    el.updateConfig?.({
      limitations: {
        autoMitigateRuntimeModeSwitch: true,
        policies: {},
      },
      selection: {
        mode: 'multi',
      },
    });

    const after = el.getSelectedValues?.() || [];
    expect(after).toHaveLength(0);
  });
});
