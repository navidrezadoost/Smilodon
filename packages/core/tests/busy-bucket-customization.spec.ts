import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

describe('busy bucket customization', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
    vi.useRealTimers();
  });

  const configureBusyBucket = (config: Record<string, unknown>) => {
    Object.assign((select as any)._config.busyBucket, config);
  };

  it('retains the default spinner and message in the built-in bucket structure', () => {
    (select as any)._setBusy(true);

    const bucket = select.shadowRoot!.querySelector('.busy-bucket')!;
    expect(bucket.getAttribute('part')).toBe('loading');
    expect(bucket.querySelector('[part="loading-icon"] [part="loading-spinner"]')?.getAttribute('aria-hidden'))
      .toBe('true');
    expect(bucket.querySelector('[part="loading-message"]')?.textContent).toBe('Loading...');
    expect(bucket.querySelector('slot[name="loading-icon"]')).toBeTruthy();
    expect(bucket.querySelector('slot[name="loading-content"]')).toBeTruthy();
    expect((select.shadowRoot!.querySelector('style')?.textContent ?? '')).toContain('flex-direction: column');
  });

  it('preserves an empty built-in message in append mode', () => {
    configureBusyBucket({ message: '', contentMode: 'append' });
    (select as any)._setBusy(true);

    const message = select.shadowRoot!.querySelector<HTMLElement>('[part="loading-message"]');
    expect(message?.textContent).toBe('');
    expect(message?.hasAttribute('hidden')).toBe(false);
  });

  it('uses the accessible fallback when replacement content is hidden from assistive technology', () => {
    configureBusyBucket({ contentMode: 'replace', showSpinner: false, showMessage: false, message: '' });
    const hiddenContent = document.createElement('span');
    hiddenContent.slot = 'loading-content';
    hiddenContent.setAttribute('hidden', '');
    hiddenContent.textContent = 'Hidden loading status';
    select.appendChild(hiddenContent);

    (select as any)._setBusy(true);

    const bucket = select.shadowRoot!.querySelector('.busy-bucket')!;
    expect(bucket.classList.contains('busy-bucket--replace')).toBe(false);
    expect(bucket.querySelector('[part="loading-message"]')?.textContent).toBe('Loading...');
    expect(bucket.querySelector('[part="loading-message"]')?.hasAttribute('hidden')).toBe(false);
  });

  it('hides an empty icon wrapper when the spinner and custom icon are absent', () => {
    configureBusyBucket({ showSpinner: false });
    (select as any)._setBusy(true);

    const bucket = select.shadowRoot!.querySelector('.busy-bucket')!;
    const icon = bucket.querySelector<HTMLElement>('.busy-icon');
    expect(bucket.querySelector('[part="loading-spinner"]')).toBeNull();
    expect(bucket.querySelector<HTMLSlotElement>('slot[name="loading-icon"]')?.assignedNodes()).toHaveLength(0);
    expect(icon?.hasAttribute('hidden')).toBe(true);
    expect(select.shadowRoot!.querySelector('style')?.textContent).toContain('.busy-icon[hidden]');
  });

  it('shows a custom icon even when the fallback spinner is disabled and keeps slotted content in light DOM', () => {
    configureBusyBucket({ showSpinner: false, showMessage: false });
    const icon = document.createElement('span');
    icon.slot = 'loading-icon';
    icon.textContent = 'custom icon';
    const content = document.createElement('strong');
    content.slot = 'loading-content';
    content.textContent = 'Loading products';
    select.append(icon, content);

    (select as any)._setBusy(true);

    const bucket = select.shadowRoot!.querySelector('.busy-bucket')!;
    expect(bucket.querySelector('[part="loading-spinner"]')).toBeNull();
    expect(bucket.querySelector('[part="loading-message"]')?.hasAttribute('hidden')).toBe(true);
    expect(select.contains(icon)).toBe(true);
    expect(select.contains(content)).toBe(true);
    expect(bucket.querySelector('[part="loading-icon"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(bucket.querySelector<HTMLSlotElement>('slot[name="loading-icon"]')?.assignedNodes()).toContain(icon);
    expect(bucket.querySelector<HTMLSlotElement>('slot[name="loading-content"]')?.assignedNodes()).toContain(content);
  });

  it('replaces built-in UI only when loading content has an accessible name and otherwise provides a fallback', () => {
    configureBusyBucket({ contentMode: 'replace', showSpinner: false, showMessage: false, message: '' });
    (select as any)._setBusy(true);

    let bucket = select.shadowRoot!.querySelector('.busy-bucket')!;
    expect(bucket.classList.contains('busy-bucket--replace')).toBe(false);
    expect(bucket.querySelector('[part="loading-message"]')?.textContent).toBe('Loading...');
    expect(bucket.querySelector('[part="loading-message"]')?.hasAttribute('hidden')).toBe(false);

    const decorativeOnly = document.createElement('div');
    decorativeOnly.slot = 'loading-content';
    decorativeOnly.setAttribute('aria-hidden', 'true');
    decorativeOnly.textContent = 'Decorative spinner';
    select.appendChild(decorativeOnly);
    (select as any)._renderOptions();
    bucket = select.shadowRoot!.querySelector('.busy-bucket')!;
    expect(bucket.classList.contains('busy-bucket--replace')).toBe(false);
    expect(bucket.querySelector('[part="loading-message"]')?.hasAttribute('hidden')).toBe(false);

    decorativeOnly.remove();
    const content = document.createElement('div');
    content.slot = 'loading-content';
    content.textContent = 'Fetching additional records';
    select.appendChild(content);
    (select as any)._renderOptions();
    bucket = select.shadowRoot!.querySelector('.busy-bucket')!;

    expect(bucket.classList.contains('busy-bucket--replace')).toBe(true);
    expect(bucket.querySelector('[part="loading-message"]')?.hasAttribute('hidden')).toBe(true);
    expect(bucket.querySelector('[part="loading-content"]')?.hasAttribute('hidden')).toBe(false);
    expect(select.contains(content)).toBe(true);
  });

  it('holds only the visual bucket for the remaining minimum time while logical busy and ARIA update immediately', () => {
    vi.useFakeTimers();
    configureBusyBucket({ minDisplayTime: 200 });
    (select as any)._setBusy(true);
    vi.advanceTimersByTime(50);

    (select as any)._setBusy(false);
    const listbox = select.shadowRoot!.querySelector('[role="listbox"]')!;
    expect(listbox.getAttribute('aria-busy')).not.toBe('true');
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();

    vi.advanceTimersByTime(149);
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();
    vi.advanceTimersByTime(1);
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeNull();
  });

  it('does not let an old hide timer hide a newer request', () => {
    vi.useFakeTimers();
    configureBusyBucket({ minDisplayTime: 200 });
    (select as any)._setBusy(true);
    vi.advanceTimersByTime(80);
    (select as any)._setBusy(false);
    vi.advanceTimersByTime(50);
    (select as any)._setBusy(true);
    (select as any)._setBusy(false);

    vi.advanceTimersByTime(199);
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();
    vi.advanceTimersByTime(1);
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeNull();
  });

  it('clears the bucket immediately on cancellation and disconnect', () => {
    vi.useFakeTimers();
    configureBusyBucket({ minDisplayTime: 1000 });
    (select as any)._setBusy(true);
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();

    (select as any)._cancelBusyPresentation();
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeNull();

    (select as any)._setBusy(true);
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();
    select.remove();
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeNull();
  });

  it('keeps acknowledged failure presentation after the request and ARIA state finish', async () => {
    vi.useFakeTimers();
    // The acknowledged test seam must be enabled after the host connects so
    // its initial request is observable, matching the coordinator fixtures.
    select.remove();
    select.updateConfig({
      busyBucket: { enabled: true, minDisplayTime: 200 },
      loadMore: { enabled: true, itemsPerLoad: 2 },
    });
    select.setItems([
      { id: 'one', value: 'one', label: 'One' },
      { id: 'two', value: 'two', label: 'Two' },
    ]);
    const searches: any[] = [];
    const loads: any[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    select.addEventListener('loadMore', (event) => loads.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    (select as any)._enableAcknowledgedDataLoadingForTest({
      dataLoading: {
        protocol: 'acknowledged',
        searchMode: 'remote',
        paginationMode: 'page',
        fetchLimit: 2,
      },
      infiniteScroll: { enabled: true, pageSize: 2, initialPage: 1 },
    }, { hasMore: true });
    await (select as any)._setAcknowledgedDataLoadingReadyForTest();

    const initialRequest = searches[0].request;
    expect(await (select as any)._completeDataRequestForTest({
      requestId: initialRequest.requestId,
      queryGeneration: initialRequest.queryGeneration,
      status: 'succeeded',
      items: [
        { id: 'one', value: 'one', label: 'One' },
        { id: 'two', value: 'two', label: 'Two' },
      ],
      hasMore: true,
    })).toBe('accepted');

    await (select as any)._loadMoreItems('manual');
    const loadRequest = loads[0].request;
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();
    vi.advanceTimersByTime(50);

    expect(await (select as any)._completeDataRequestForTest({
      requestId: loadRequest.requestId,
      queryGeneration: loadRequest.queryGeneration,
      status: 'failed',
      error: { message: 'temporary page failure' },
    })).toBe('accepted');

    expect((select as any).getDataLoadingState().busy).toBe(false);
    expect(select.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-busy')).not.toBe('true');
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();
    vi.advanceTimersByTime(149);
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();
    vi.advanceTimersByTime(1);
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeNull();
  });

  it('keeps grouped-list busy presentation after rendering its grouped options', () => {
    select.setGroupedItems([{ label: 'Group A', options: [{ value: 'a', label: 'Alpha' }] }] as any);
    (select as any)._setBusy(true);

    expect(select.shadowRoot!.querySelector('[part="group-header"]')?.textContent).toBe('Group A');
    expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(1);
    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();
  });

  it('keeps the bucket mounted while the legacy renderer chunks a list larger than 300 items', async () => {
    const items = Array.from({ length: 360 }, (_, index) => ({
      value: `value-${index}`,
      label: `Option ${index}`,
    }));
    select.setItems(items);
    (select as any)._setBusy(true);

    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cancelAnimationFrame(frame);
        reject(new Error('chunked busy list did not render all options'));
      }, 5000);
      let frame = 0;
      const check = () => {
        if (select.shadowRoot!.querySelectorAll('[part="option"]').length === items.length) {
          window.clearTimeout(timeout);
          resolve();
          return;
        }
        frame = requestAnimationFrame(check);
      };
      check();
    });

    expect(select.shadowRoot!.querySelector('.busy-bucket')).toBeTruthy();
    expect(select.shadowRoot!.querySelectorAll('.busy-bucket')).toHaveLength(1);
  });
});
