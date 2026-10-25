import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

function createSelect(): EnhancedSelect {
  const select = document.createElement('enhanced-select') as EnhancedSelect;
  document.body.appendChild(select);
  return select;
}

function getListbox(select: EnhancedSelect): HTMLElement {
  const listbox = select.shadowRoot?.querySelector<HTMLElement>('[part="listbox"]');
  expect(listbox).toBeTruthy();
  return listbox!;
}

function useAcknowledgedProtocol(select: EnhancedSelect): void {
  select.updateConfig({ dataLoading: { protocol: 'acknowledged' } });
}

describe('Phase 2F host aria-busy presentation bridge', () => {
  let select: EnhancedSelect | undefined;

  afterEach(() => {
    select?.remove();
    select = undefined;
  });

  it('observes host aria-busy and keeps it inert in the legacy protocol', () => {
    expect(EnhancedSelect.observedAttributes).toContain('aria-busy');

    select = createSelect();
    const listbox = getListbox(select);

    select.setAttribute('aria-busy', 'true');
    expect(select.getAttribute('aria-busy')).toBe('true');
    expect(listbox.hasAttribute('aria-busy')).toBe(false);

    (select as any)._setBusy(true);
    expect(listbox.getAttribute('aria-busy')).toBe('true');

    select.removeAttribute('aria-busy');
    expect(listbox.getAttribute('aria-busy')).toBe('true');

    (select as any)._setBusy(false);
    expect(listbox.hasAttribute('aria-busy')).toBe(false);
  });

  it('aggregates exact host true with core busy only after acknowledged opt-in', () => {
    select = createSelect();
    useAcknowledgedProtocol(select);
    const listbox = getListbox(select);

    select.setAttribute('aria-busy', 'false');
    expect(listbox.hasAttribute('aria-busy')).toBe(false);
    select.setAttribute('aria-busy', 'TRUE');
    expect(listbox.hasAttribute('aria-busy')).toBe(false);

    select.setAttribute('aria-busy', 'true');
    expect(listbox.getAttribute('aria-busy')).toBe('true');

    (select as any)._setBusy(true);
    select.removeAttribute('aria-busy');
    expect(listbox.getAttribute('aria-busy')).toBe('true');

    select.setAttribute('aria-busy', 'true');
    (select as any)._setBusy(false);
    expect(listbox.getAttribute('aria-busy')).toBe('true');

    select.removeAttribute('aria-busy');
    expect(listbox.hasAttribute('aria-busy')).toBe(false);
  });

  it('disables the external contribution when accepted configuration returns to legacy', () => {
    select = createSelect();
    useAcknowledgedProtocol(select);
    const listbox = getListbox(select);

    select.setAttribute('aria-busy', 'true');
    expect(listbox.getAttribute('aria-busy')).toBe('true');

    select.updateConfig({ dataLoading: { protocol: 'legacy' } });

    expect(select.getAttribute('aria-busy')).toBe('true');
    expect(listbox.hasAttribute('aria-busy')).toBe(false);

    select.updateConfig({ dataLoading: { protocol: 'acknowledged' } });
    expect(listbox.getAttribute('aria-busy')).toBe('true');
  });

  it('preserves acknowledged behavior after rejecting an invalid protocol update', () => {
    select = createSelect();
    useAcknowledgedProtocol(select);
    const listbox = getListbox(select);
    select.setAttribute('aria-busy', 'true');
    expect(listbox.getAttribute('aria-busy')).toBe('true');

    select.updateConfig({
      dataLoading: { protocol: 'legacy', searchMode: 'remote' },
    });

    expect(listbox.getAttribute('aria-busy')).toBe('true');
  });

  it('applies host busy configured before connection after acknowledged opt-in', () => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.setAttribute('aria-busy', 'true');
    useAcknowledgedProtocol(select);

    expect(select.isConnected).toBe(false);
    expect(getListbox(select).getAttribute('aria-busy')).toBe('true');

    document.body.appendChild(select);
    expect(getListbox(select).getAttribute('aria-busy')).toBe('true');
  });

  it('retains acknowledged busy synchronization across disconnect and reconnect without dispatching a request', () => {
    select = createSelect();
    useAcknowledgedProtocol(select);
    const listbox = getListbox(select);
    const requestListener = vi.fn();
    select.addEventListener('search', requestListener);
    select.addEventListener('loadMore', requestListener);
    select.setAttribute('aria-busy', 'true');
    const beforeDisconnect = select.getDataLoadingState();

    select.remove();
    document.body.appendChild(select);

    expect(listbox.getAttribute('aria-busy')).toBe('true');
    expect(select.getDataLoadingState()).toEqual(beforeDisconnect);
    expect(requestListener).not.toHaveBeenCalled();
  });

  it('does not alter request lifecycle snapshots or emit requests when host presentation changes', () => {
    select = createSelect();
    useAcknowledgedProtocol(select);
    const requestListener = vi.fn();
    const cancelListener = vi.fn();
    select.addEventListener('search', requestListener);
    select.addEventListener('loadMore', requestListener);
    select.addEventListener('dataRequestCancel', cancelListener);
    const before = select.getDataLoadingState();

    select.setAttribute('aria-busy', 'true');
    const whileBusy = select.getDataLoadingState();
    select.removeAttribute('aria-busy');
    const afterClear = select.getDataLoadingState();

    expect(whileBusy).toEqual(before);
    expect(afterClear).toEqual(before);
    expect(requestListener).not.toHaveBeenCalled();
    expect(cancelListener).not.toHaveBeenCalled();
    expect(before).toMatchObject({ status: 'idle', busy: false, activeRequest: null });
  });
});
