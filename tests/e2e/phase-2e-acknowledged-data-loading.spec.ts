import { expect, test } from '@playwright/test';

const playgroundUrl = 'http://localhost:5173/vanilla-demo.html';

async function createPagedSelect(page: import('@playwright/test').Page) {
  await page.goto(playgroundUrl);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'phase-2e-acknowledged-select';
    select.updateConfig({
      searchable: true,
      loadMore: { enabled: true, itemsPerLoad: 5 },
      infiniteScroll: { enabled: true, pageSize: 5 },
      selection: { mode: 'multi', closeOnSelect: false },
    });
    select.setItems(Array.from({ length: 10 }, (_, index) => ({
      id: `initial-${index}`,
      value: `initial-${index}`,
      label: `Initial ${index}`,
    })));
    document.body.appendChild(select);

    const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
    options.style.height = '96px';
    options.style.maxHeight = '96px';
    options.style.overflowY = 'auto';
    select.open();

    (window as any).__phase2eRequests = [];
    (window as any).__phase2eSelect = select;
    select.addEventListener('loadMore', (event: CustomEvent) => {
      (window as any).__phase2eRequests.push(event.detail);
    });
    select._enableAcknowledgedDataLoadingForTest({
      dataLoading: { protocol: 'acknowledged', searchMode: 'local', fetchLimit: 5 },
      infiniteScroll: { pageSize: 5, initialPage: 1 },
    }, { hasMore: true });
    await select._setAcknowledgedDataLoadingReadyForTest();
  });
  return page.locator('#phase-2e-acknowledged-select');
}

async function scrollOptionsToEnd(select: import('@playwright/test').Locator): Promise<void> {
  await select.evaluate((element: any) => {
    const options = element.shadowRoot.querySelector('.options-container') as HTMLElement;
    options.scrollTop = options.scrollHeight;
  });
}

async function scrollOptionsToStart(select: import('@playwright/test').Locator): Promise<void> {
  await select.evaluate((element: any) => {
    const options = element.shadowRoot.querySelector('.options-container') as HTMLElement;
    options.scrollTop = 0;
  });
}

async function createRemoteSearchSelect(page: import('@playwright/test').Page) {
  await page.goto(playgroundUrl);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'phase-2e-remote-search-select';
    (window as any).__phase2eRemoteSelect = select;
    select.updateConfig({
      searchable: true,
      selection: { mode: 'multi', closeOnSelect: false },
      infiniteScroll: { enabled: false, pageSize: 5 },
    });
    const selected = { id: 'chosen', value: 'chosen', label: 'Chosen' };
    select.setItems([selected]);
    (window as any).__phase2eSearchEvents = [];
    (window as any).__phase2eSearchCallbacks = [];
    select.addEventListener('search', (event: CustomEvent) => {
      (window as any).__phase2eSearchEvents.push(event.detail);
    });
    select.updateConfig({ callbacks: {
      onSearch: (query: string, request: unknown) => {
        (window as any).__phase2eSearchCallbacks.push({ query, request });
      },
    } });
    document.body.appendChild(select);
    select.open();
    select.shadowRoot.querySelector('[data-index="0"]').click();
    select._enableAcknowledgedDataLoadingForTest({
      dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5 },
    });
    await select._setAcknowledgedDataLoadingReadyForTest();
  });
  return page.locator('#phase-2e-remote-search-select');
}

test.describe('Phase 2E acknowledged data-loading browser integration', () => {
  test('routes remote search, preserves selection and ARIA, and retries accepted projection canonically', async ({ page }) => {
    const select = await createRemoteSearchSelect(page);
    const eventCount = () => page.evaluate(() => (window as any).__phase2eSearchEvents.length);

    await expect.poll(eventCount).toBe(1);
    const initial = await page.evaluate(() => (window as any).__phase2eSearchEvents[0]);
    expect(initial.query).toBe('');
    expect(initial.request.requestId).toBeTruthy();
    const initialResult = await page.evaluate(async (request) => {
      const element = document.querySelector('#phase-2e-remote-search-select') as any;
      return element._completeDataRequestForTest({
        requestId: request.requestId,
        queryGeneration: request.queryGeneration,
        status: 'exhausted',
        items: [{ id: 'chosen', value: 'chosen', label: 'Chosen' }],
        hasMore: false,
      });
    }, initial.request);
    expect(initialResult).toBe('accepted');

    const input = select.locator('[part="input"]');
    await input.evaluate((element: HTMLInputElement) => {
      element.value = 'Banana';
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    await expect.poll(eventCount).toBe(2);
    const search = await page.evaluate(() => (window as any).__phase2eSearchEvents[1]);
    const callback = await page.evaluate(() => (window as any).__phase2eSearchCallbacks[1]);
    expect(search.query).toBe('Banana');
    expect(callback.query).toBe('Banana');
    expect(callback.request.requestId).toBe(search.request.requestId);
    await expect(select.locator('[role="listbox"]')).toHaveAttribute('aria-busy', 'true');

    const bananaResult = await page.evaluate(async (request) => {
      const element = document.querySelector('#phase-2e-remote-search-select') as any;
      return element._completeDataRequestForTest({
        requestId: request.requestId,
        queryGeneration: request.queryGeneration,
        status: 'exhausted',
        items: [{ id: 'banana', value: 'banana', label: 'Banana' }],
        hasMore: false,
      });
    }, search.request);
    expect(bananaResult).toBe('accepted');
    await expect(select.locator('[data-value="banana"]')).toBeVisible();
    await expect(input).toHaveValue('Banana');
    await expect(select.locator('[role="listbox"]')).not.toHaveAttribute('aria-busy', 'true');
    const selectedValues = await select.evaluate((element: any) => element.getSelectedItems().map((item: any) => item.value));
    expect(selectedValues).toEqual(['chosen']);

    await input.evaluate((element: HTMLInputElement) => {
      element.value = 'Cherry';
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    await expect.poll(eventCount).toBe(3);
    const cherryRequest = await page.evaluate(() => (window as any).__phase2eSearchEvents[2].request);
    const recovery = await page.evaluate(async (request) => {
      const element = document.querySelector('#phase-2e-remote-search-select') as any;
      element._failNextAcknowledgedProjectionForTest('before-publish');
      const result = await element._completeDataRequestForTest({
        requestId: request.requestId,
        queryGeneration: request.queryGeneration,
        status: 'exhausted',
        items: [{ id: 'cherry', value: 'cherry', label: 'Cherry' }],
        hasMore: false,
      });
      const beforeRetry = {
        result,
        pending: element._acknowledgedProjectionPending,
        oldOptionPresent: Boolean(element.shadowRoot.querySelector('[data-value="banana"]')),
      };
      await element._retryAcknowledgedProjectionForTest();
      return { ...beforeRetry, pendingAfterRetry: element._acknowledgedProjectionPending };
    }, cherryRequest);
    expect(recovery).toEqual({ result: 'accepted', pending: true, oldOptionPresent: true, pendingAfterRetry: false });
    await expect(select.locator('[data-value="cherry"]')).toBeVisible();
    expect(await select.evaluate((element: any) => element.getSelectedItems().map((item: any) => item.value))).toEqual(['chosen']);

    await input.focus();
    await input.press('ArrowDown');
    const activeDescendant = await input.getAttribute('aria-activedescendant');
    expect(activeDescendant).toBeTruthy();
    expect(await select.evaluate((element: any, id) => Boolean(element.shadowRoot.getElementById(id)), activeDescendant)).toBe(true);
  });

  test('coalesces latest search intent during chunked projection and resumes it after disconnect', async ({ page }) => {
    const select = await createRemoteSearchSelect(page);
    const eventCount = () => page.evaluate(() => (window as any).__phase2eSearchEvents.length);

    await expect.poll(eventCount).toBe(1);
    const initial = await page.evaluate(() => (window as any).__phase2eSearchEvents[0]);
    const interrupted = await page.evaluate((request) => {
      const element = document.querySelector('#phase-2e-remote-search-select') as any;
      const largeResult = Array.from({ length: 401 }, (_, index) => ({
        id: `interrupted-${index}`,
        value: `interrupted-${index}`,
        label: `Interrupted ${index}`,
      }));
      const projection = element._completeDataRequestForTest({
        requestId: request.requestId,
        queryGeneration: request.queryGeneration,
        status: 'succeeded',
        items: largeResult,
        hasMore: true,
      });
      (window as any).__phase2eProjection = projection;

      const input = element.shadowRoot.querySelector('[part="input"]') as HTMLInputElement;
      input.value = 'Banana';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      input.value = 'Cherry';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

      const beforeDisconnect = {
        projectionPending: element._acknowledgedProjectionPending,
        inputValue: input.value,
        committedQuery: element._state.searchQuery,
        coordinatorQuery: element._dataRequestCoordinator.getSnapshot().query,
        queryGeneration: element._dataRequestCoordinator.getSnapshot().queryGeneration,
        searchEventCount: (window as any).__phase2eSearchEvents.length,
      };
      element.remove();
      return beforeDisconnect;
    }, initial.request);

    expect(interrupted).toEqual({
      projectionPending: true,
      inputValue: 'Cherry',
      committedQuery: '',
      coordinatorQuery: '',
      queryGeneration: initial.request.queryGeneration,
      searchEventCount: 1,
    });

    const interruptedProjectionResult = await page.evaluate(async () => {
      return await (window as any).__phase2eProjection;
    });
    expect(interruptedProjectionResult).toBe('accepted');

    await page.evaluate(async () => {
      const element = (window as any).__phase2eRemoteSelect;
      document.body.appendChild(element);
      await element._setAcknowledgedDataLoadingReadyForTest();
    });

    await expect.poll(eventCount, { timeout: 8_000 }).toBe(2);
    const resumed = await page.evaluate(() => {
      const element = document.querySelector('#phase-2e-remote-search-select') as any;
      const event = (window as any).__phase2eSearchEvents[1];
      const callback = (window as any).__phase2eSearchCallbacks[1];
      return {
        event,
        callback,
        inputValue: element.shadowRoot.querySelector('[part="input"]').value,
        committedQuery: element._state.searchQuery,
        coordinatorQuery: element._dataRequestCoordinator.getSnapshot().query,
        queryGeneration: element._dataRequestCoordinator.getSnapshot().queryGeneration,
        projectionPending: element._acknowledgedProjectionPending,
        selectedValues: element.getSelectedItems().map((item: any) => item.value),
      };
    });

    expect(resumed.event.query).toBe('Cherry');
    expect(resumed.callback.query).toBe('Cherry');
    expect(resumed.callback.request.requestId).toBe(resumed.event.request.requestId);
    expect(resumed.inputValue).toBe('Cherry');
    expect(resumed.committedQuery).toBe('Cherry');
    expect(resumed.coordinatorQuery).toBe('Cherry');
    expect(resumed.queryGeneration).toBeGreaterThan(initial.request.queryGeneration);
    expect(resumed.projectionPending).toBe(false);
    expect(resumed.selectedValues).toEqual(['chosen']);
    await expect(select.locator('[role="listbox"]')).toHaveAttribute('aria-busy', 'true');
  });

  test('uses the list scroll root, re-arms on a real layout exit, and replaces observer on reconnect', async ({ page }) => {
    const select = await createPagedSelect(page);
    const requestCount = () => page.evaluate(() => (window as any).__phase2eRequests.length);

    await scrollOptionsToEnd(select);
    await expect.poll(requestCount, { timeout: 8_000 }).toBe(1);
    const first = await page.evaluate(() => (window as any).__phase2eRequests[0]);
    expect(first.request.position).toEqual({ mode: 'page', page: 2 });

    const completionResult = await page.evaluate(async (request) => {
      const select = document.querySelector('#phase-2e-acknowledged-select') as any;
      const replacement = Array.from({ length: 20 }, (_, index) => ({
        id: `page-${index}`,
        value: `page-${index}`,
        label: `Page ${index}`,
      }));
      return await select._completeDataRequestForTest({
        requestId: request.requestId,
        queryGeneration: request.queryGeneration,
        status: 'succeeded',
        items: replacement,
        hasMore: true,
      });
    }, first.request);
    expect(completionResult).toBe('accepted');

    // The accepted replacement moves the sentinel below the preserved scroll
    // position. A second request must wait for the list to reach it again.
    await expect.poll(requestCount).toBe(1);
    await scrollOptionsToEnd(select);
    await expect.poll(requestCount, { timeout: 8_000 }).toBe(2);
    const second = await page.evaluate(() => (window as any).__phase2eRequests[1]);
    expect(second.request.requestId).not.toBe(first.request.requestId);
    expect(second.request.position).toEqual({ mode: 'page', page: 3 });

    await page.evaluate(() => (window as any).__phase2eSelect.remove());
    await page.evaluate(() => {
      document.body.appendChild((window as any).__phase2eSelect);
    });
    await select.evaluate(async (element: any) => await element._setAcknowledgedDataLoadingReadyForTest());
    await select.evaluate((element: any) => element.open());

    const sentinelSnapshot = () => select.evaluate((element: any) =>
      element._dataRequestCoordinator.getSnapshot());
    // Reconnect observes the still-visible sentinel, but an interrupted
    // load-more is not replayed until a fresh exit/re-entry (or manual action).
    await expect.poll(async () => (await sentinelSnapshot()).sentinelIntersecting, { timeout: 8_000 }).toBe(true);
    expect(await requestCount()).toBe(2);
    expect((await sentinelSnapshot()).sentinelBlocked).toBe(true);

    await scrollOptionsToStart(select);
    await expect.poll(async () => (await sentinelSnapshot()).sentinelIntersecting, { timeout: 8_000 }).toBe(false);
    expect((await sentinelSnapshot()).sentinelBlocked).toBe(false);
    await scrollOptionsToEnd(select);
    await expect.poll(requestCount, { timeout: 8_000 }).toBe(3);
    const reconnected = await page.evaluate(() => (window as any).__phase2eRequests[2]);
    expect(reconnected.request.requestId).not.toBe(second.request.requestId);
    expect(reconnected.request.position).toEqual({ mode: 'page', page: 3 });
  });
});
