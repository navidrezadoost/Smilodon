import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/dom';
import '@smilodon/core';
import {
  createSelect,
  getCapabilities,
  getKnownLimitations,
  getTrackingSnapshot,
  clearTracking,
  setLimitationPolicies,
} from '@smilodon/vanilla';
import { basicItems } from './fixtures/test-data';

describe('Vanilla Adapter Contract Tests', () => {
  it('forwards option selection through the vanilla helper callback with item and index', async () => {
    const onSelect = vi.fn();
    const element = createSelect({ items: basicItems, onSelect }) as any;
    document.body.appendChild(element);

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
    element.remove();
  });

  it('supports diagnostic events and runtime limitation/tracking controls', async () => {
    const onDiagnostic = vi.fn();

    const element = createSelect({
      items: basicItems,
      trackingEnabled: true,
      emitDiagnostics: true,
      onDiagnostic,
    }) as any;

    document.body.appendChild(element);

    await waitFor(() => {
      expect(typeof element.open).toBe('function');
    });

    element.open();

    await waitFor(() => {
      expect(onDiagnostic).toHaveBeenCalled();
    });

    const diagnostics = onDiagnostic.mock.calls.map((call) => call[0]);
    const hasOpenEventDiagnostic = diagnostics.some(
      (detail) => detail?.source === 'event' && detail?.name === 'open'
    );
    expect(hasOpenEventDiagnostic).toBe(true);

    const capabilities = getCapabilities(element);
    expect(capabilities?.events?.diagnosticEvent).toBe(true);

    const limitations = getKnownLimitations(element);
    expect(limitations.some((item: any) => item.id === 'runtimeModeSwitching')).toBe(true);

    await waitFor(() => {
      const snapshot = getTrackingSnapshot(element);
      expect(snapshot.events.length).toBeGreaterThan(0);
    });

    clearTracking(element, 'event');
    expect(getTrackingSnapshot(element).events).toHaveLength(0);

    setLimitationPolicies(element, { runtimeModeSwitching: { mode: 'strict' } });
    const updated = getKnownLimitations(element).find((item: any) => item.id === 'runtimeModeSwitching');
    expect(updated?.mode).toBe('strict');
  });
});
