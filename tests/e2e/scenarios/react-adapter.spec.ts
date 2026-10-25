import { expect, test } from '@playwright/test';

const fixtureUrl = 'http://localhost:5173/react-certification.html';

async function waitForReactReady(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => {
    return window.__smilodonReactCertification?.state()?.connected ?? false;
  })).toBe(true);
}

async function readEvents(page: import('@playwright/test').Page) {
  return page.evaluate(() => window.__smilodonReactCertification?.events ?? []);
}

test.describe('React adapter browser certification @react-adapter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixtureUrl);
    await waitForReactReady(page);
  });

  test('renders through the React package with controlled value, callback mapping, and className', async ({ page }) => {
    const host = page.locator('enhanced-select.react-certification-select');
    await expect(host).toHaveAttribute('class', 'react-certification-select');
    await expect(page.locator('#controlled-value')).toHaveText('apple');

    const initialRequest = (await readEvents(page)).find((event) => event.type === 'search')?.request as {
      requestId: string;
      queryGeneration: number;
    };
    const accepted = await page.evaluate((request) => window.__smilodonReactCertification?.complete({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }, { value: 'cherry', label: 'Cherry' }],
      hasMore: true,
      nextCursor: 'selection-cursor',
    }), initialRequest);
    expect(accepted).toBe('accepted');

    await host.locator('input').click();
    await host.locator('select-option').nth(1).click();
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'change').length)
      .toBe(1);
    const change = (await readEvents(page)).find((event) => event.type === 'change');
    expect(change?.value).toBe('banana');
    await expect(page.locator('#controlled-value')).toHaveText('banana');
    await expect.poll(() => page.evaluate(() => window.__smilodonReactCertification?.selectedValues()))
      .toEqual(['banana']);
  });

  test('preserves legacy callback arguments without acknowledged request metadata', async ({ page }) => {
    await page.goto(`${fixtureUrl}?protocol=legacy`);
    await waitForReactReady(page);
    await page.evaluate(() => window.__smilodonReactCertification?.clearEvents());
    await page.locator('enhanced-select input').fill('Ban');

    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'search').length)
      .toBe(1);
    const event = (await readEvents(page)).find((entry) => entry.type === 'search');
    expect(event?.searchQuery).toBe('Ban');
    expect(event?.count).toBe(1);
    expect(event?.request).toBeNull();
    expect(event?.results).toHaveLength(1);
  });

  test('opens exactly one initial request in React Strict Mode', async ({ page }) => {
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'search').length)
      .toBe(1);
    await page.waitForTimeout(150);
    const requests = (await readEvents(page)).filter((event) => event.type === 'search');
    expect(requests).toHaveLength(1);
    expect(requests[0]?.request).toMatchObject({
      kind: 'search',
      query: '',
      position: { mode: 'cursor', ordinal: 1 },
      fetchLimit: 3,
    });
    const events = await readEvents(page);
    const eventNotificationIndex = events.findIndex((event) => event.type === 'searchEvent');
    const reactCallbackIndex = events.findIndex((event) => event.type === 'search');
    expect(eventNotificationIndex).toBeGreaterThanOrEqual(0);
    expect(eventNotificationIndex).toBeLessThan(reactCallbackIndex);
    expect((events[eventNotificationIndex]?.detail as { request?: unknown }).request)
      .toEqual(requests[0]?.request);
  });

  test('dispatches the exact empty remote query when search is cleared', async ({ page }) => {
    const initialRequest = (await readEvents(page)).find((event) => event.type === 'search')?.request as {
      requestId: string;
      queryGeneration: number;
    };
    await page.evaluate(() => window.__smilodonReactCertification?.dispatchSearch('pear'));
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'search').length)
      .toBe(2);
    await page.evaluate(() => window.__smilodonReactCertification?.dispatchSearch(''));
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'search').length)
      .toBe(3);

    const requests = (await readEvents(page))
      .filter((event) => event.type === 'search')
      .map((event) => event.request as { requestId: string; queryGeneration: number; query: string });
    expect(requests.map((request) => request.query)).toEqual(['', 'pear', '']);
    expect(new Set(requests.map((request) => request.requestId)).size).toBe(3);
    expect(requests[2]?.queryGeneration).toBeGreaterThan(initialRequest.queryGeneration);
  });

  test('rejects invalid config atomically and suppresses duplicate pending search intents', async ({ page }) => {
    await page.goto(`${fixtureUrl}?uncontrolled=1`);
    await waitForReactReady(page);
    const firstRequest = (await readEvents(page)).find((event) => event.type === 'search')?.request as {
      requestId: string;
    };
    expect(firstRequest?.requestId).toBeTruthy();

    await page.evaluate(() => {
      const api = window.__smilodonReactCertification!;
      api.dispatchSearch('pear');
      api.dispatchSearch('pear');
    });
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'search').length)
      .toBe(2);

    await page.evaluate(() => window.__smilodonReactCertification?.update({
      config: {
        placeholder: 'Unrelated update retained',
        dataLoading: { protocol: 'acknowledged', searchMode: 'invalid' } as never,
      },
    }));
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'configError').length)
      .toBe(1);
    await expect(page.locator('enhanced-select input')).toHaveAttribute('placeholder', 'Unrelated update retained');

    await page.evaluate(() => window.__smilodonReactCertification?.update({
      config: {
        placeholder: 'Repeated invalid update retained',
        dataLoading: { protocol: 'acknowledged', searchMode: 'invalid' } as never,
      },
    }));
    await expect(page.locator('enhanced-select input')).toHaveAttribute('placeholder', 'Repeated invalid update retained');
    expect((await readEvents(page)).filter((event) => event.type === 'configError')).toHaveLength(1);

    await page.evaluate(() => window.__smilodonReactCertification?.update({
      config: {
        placeholder: 'Changed invalid update retained',
        dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 0 } as never,
      },
    }));
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'configError').length)
      .toBe(2);
    await page.evaluate(() => window.__smilodonReactCertification?.update({
      config: {
        placeholder: 'Repeated changed-invalid update retained',
        dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 0 } as never,
      },
    }));
    await expect(page.locator('enhanced-select input')).toHaveAttribute('placeholder', 'Repeated changed-invalid update retained');
    expect((await readEvents(page)).filter((event) => event.type === 'configError')).toHaveLength(2);

    const state = await page.evaluate(() => window.__smilodonReactCertification?.state());
    const searches = (await readEvents(page)).filter((event) => event.type === 'search');
    expect(searches).toHaveLength(2);
    expect(state?.activeRequest?.requestId).toBe((searches[1]?.request as { requestId: string }).requestId);
  });

  test('rejects stale completion and projects a valid completion once with its original identity', async ({ page }) => {
    const initialRequest = (await readEvents(page)).find((event) => event.type === 'search')?.request as {
      requestId: string;
      queryGeneration: number;
    };
    await page.evaluate(() => window.__smilodonReactCertification?.dispatchSearch('pear'));
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'search').length)
      .toBe(2);
    const currentRequest = (await readEvents(page)).filter((event) => event.type === 'search')[1]?.request as {
      requestId: string;
      queryGeneration: number;
    };

    const staleResult = await page.evaluate((request) => window.__smilodonReactCertification?.complete({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'exhausted',
      items: [{ value: 'old', label: 'Old result' }],
      hasMore: false,
    }), initialRequest);
    expect(staleResult).toBe('stale');

    const accepted = await page.evaluate((request) => window.__smilodonReactCertification?.complete({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'exhausted',
      items: [{ value: 'pear', label: 'Pear' }],
      hasMore: false,
    }), currentRequest);
    expect(accepted).toBe('accepted');
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'projection').length)
      .toBe(1);
    const projection = (await readEvents(page)).find((event) => event.type === 'projection')?.detail as {
      requestId: string;
      queryGeneration: number;
      status: string;
    };
    expect(projection).toMatchObject({
      requestId: currentRequest.requestId,
      queryGeneration: currentRequest.queryGeneration,
      status: 'complete',
    });
    await expect.poll(() => page.evaluate(() => window.__smilodonReactCertification?.state()?.busy))
      .toBe(false);
  });

  test('forwards cursor pagination and observes exhaustion without consuming a duplicate position', async ({ page }) => {
    const searchRequest = (await readEvents(page)).find((event) => event.type === 'search')?.request as {
      requestId: string;
      queryGeneration: number;
    };
    const firstCompletion = await page.evaluate((request) => window.__smilodonReactCertification?.complete({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }],
      hasMore: true,
      nextCursor: 'cursor-1',
    }), searchRequest);
    expect(firstCompletion).toBe('accepted');
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'projection').length)
      .toBe(1);

    await page.evaluate(() => window.__smilodonReactCertification?.open());
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'loadMore').length)
      .toBe(1);
    const loadRequest = (await readEvents(page)).find((event) => event.type === 'loadMore')?.request as {
      requestId: string;
      queryGeneration: number;
      fetchLimit: number;
      position: { mode: string; cursor?: string; ordinal: number };
    };
    expect(loadRequest).toBeTruthy();
    expect(loadRequest).toMatchObject({
      fetchLimit: 3,
      position: { mode: 'cursor', cursor: 'cursor-1', ordinal: 2 },
    });
    const notifications = await readEvents(page);
    const loadMoreEvent = notifications.find((event) => event.type === 'loadMoreEvent')?.detail as {
      request?: unknown;
    };
    expect(loadMoreEvent.request).toEqual(loadRequest);
    expect(notifications.findIndex((event) => event.type === 'loadMoreEvent'))
      .toBeLessThan(notifications.findIndex((event) => event.type === 'loadMore'));

    const exhausted = await page.evaluate((request) => window.__smilodonReactCertification?.complete({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'exhausted',
      items: [{ value: 'cherry', label: 'Cherry' }],
      hasMore: false,
    }), loadRequest);
    expect(exhausted).toBe('accepted');
    await expect.poll(() => page.evaluate(() => window.__smilodonReactCertification?.state()?.status))
      .toBe('exhausted');
    expect(await page.evaluate(() => window.__smilodonReactCertification?.state()?.hasMore)).toBe(false);
  });

  test('composes external loading, consumer aria-busy, and core busy independently', async ({ page }) => {
    const host = page.locator('enhanced-select');
    const listbox = host.locator('[role="listbox"]');
    const request = (await readEvents(page)).find((event) => event.type === 'search')?.request as {
      requestId: string;
      queryGeneration: number;
    };

    await page.evaluate(() => window.__smilodonReactCertification?.update({ loading: true, consumerBusy: false }));
    await expect(host).toHaveAttribute('aria-busy', 'true');
    await expect(listbox).toHaveAttribute('aria-busy', 'true');

    const accepted = await page.evaluate((activeRequest) => window.__smilodonReactCertification?.complete({
      requestId: activeRequest.requestId,
      queryGeneration: activeRequest.queryGeneration,
      status: 'exhausted',
      items: [],
      hasMore: false,
    }), request);
    expect(accepted).toBe('accepted');
    await expect.poll(() => page.evaluate(() => window.__smilodonReactCertification?.state()?.busy))
      .toBe(false);
    await expect(listbox).toHaveAttribute('aria-busy', 'true');

    await page.evaluate(() => window.__smilodonReactCertification?.update({ loading: false, consumerBusy: true }));
    await expect(host).toHaveAttribute('aria-busy', 'true');
    await page.evaluate(() => window.__smilodonReactCertification?.update({ consumerBusy: false }));
    await expect(host).toHaveAttribute('aria-busy', 'false');
    await expect(listbox).not.toHaveAttribute('aria-busy', 'true');
  });

  test('keeps selected identity across a hybrid result that omits the selected item', async ({ page }) => {
    await page.goto(`${fixtureUrl}?mode=hybrid`);
    await waitForReactReady(page);
    const request = (await readEvents(page)).find((event) => event.type === 'search')?.request as {
      requestId: string;
      queryGeneration: number;
    };
    await page.evaluate((activeRequest) => window.__smilodonReactCertification?.complete({
      requestId: activeRequest.requestId,
      queryGeneration: activeRequest.queryGeneration,
      status: 'exhausted',
      items: [{ value: 'banana', label: 'Banana' }],
      hasMore: false,
    }), request);

    await expect.poll(() => page.evaluate(() => window.__smilodonReactCertification?.selectedValues()))
      .toEqual(['apple']);
  });

  test('preserves keyboard focus semantics and detaches listeners across React unmount/remount', async ({ page }) => {
    const host = page.locator('enhanced-select');
    const input = host.locator('input');
    const initialRequest = (await readEvents(page)).find((event) => event.type === 'search')?.request as {
      requestId: string;
      queryGeneration: number;
    };
    await page.evaluate((request) => window.__smilodonReactCertification?.complete({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }, { value: 'cherry', label: 'Cherry' }],
      hasMore: true,
      nextCursor: 'keyboard-cursor',
    }), initialRequest);
    await input.click();
    await input.focus();
    await input.press('ArrowDown');
    const activeDescendant = await input.getAttribute('aria-activedescendant');
    expect(activeDescendant).toBeTruthy();
    await expect(host.locator(`#${activeDescendant}`)).toBeVisible();

    const detachedHost = await page.evaluateHandle(() => window.__smilodonReactCertification?.host());
    await page.evaluate(() => window.__smilodonReactCertification?.unmount());
    await page.evaluate((handle) => {
      const hostElement = handle as HTMLElement | null;
      hostElement?.dispatchEvent(new CustomEvent('search', {
        detail: { query: 'after-unmount', results: [], count: 0 },
      }));
    }, detachedHost);
    expect((await readEvents(page)).filter((event) => event.type === 'search')).toHaveLength(1);

    await page.evaluate(() => window.__smilodonReactCertification?.remount());
    await waitForReactReady(page);
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'search').length)
      .toBe(2);
    await page.waitForTimeout(150);
    expect((await readEvents(page)).filter((event) => event.type === 'search')).toHaveLength(2);
  });
});
