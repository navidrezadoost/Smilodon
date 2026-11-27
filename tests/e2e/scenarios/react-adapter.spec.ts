import { expect, test } from '@playwright/test';

const fixtureUrl = 'http://localhost:5173/react-certification.html';

async function waitForReactReady(page: import('@playwright/test').Page) {
  const params = new URL(page.url()).searchParams;
  if (params.get('scenario') === 'issue-121-tooltip') {
    await expect.poll(() => page.evaluate(() => window.__smilodonReactCertification?.host()?.isConnected ?? false))
      .toBe(true);
    return;
  }
  await expect.poll(() => page.evaluate(() => {
    return window.__smilodonReactCertification?.state()?.connected ?? false;
  })).toBe(true);
  if (params.get('scenario') !== 'issue-82-active-class'
    && params.get('scenario') !== 'issue-119-custom-arrow'
    && params.get('scenario') !== 'issue-121-tooltip'
    && params.get('protocol') !== 'legacy') {
    await expect.poll(async () => (await readEvents(page)).some((event) => event.type === 'search'))
      .toBe(true);
  }
}

async function readEvents(page: import('@playwright/test').Page) {
  return page.evaluate(() => window.__smilodonReactCertification?.events ?? []);
}

test.describe('React adapter browser certification @react-adapter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixtureUrl);
    await waitForReactReady(page);
  });

  test('Issue #121: controlled selected-label tooltip survives unrelated React rerenders @react-adapter', async ({ page }) => {
    await page.goto(`${fixtureUrl}?scenario=issue-121-tooltip`);
    await waitForReactReady(page);
    const host = page.locator('enhanced-select.react-certification-select');
    const input = host.locator('[part="input"]');
    const popup = host.locator('[role="tooltip"]');
    await expect(page.locator('#controlled-value')).toHaveText('issue121-long');
    await input.hover();
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText('International Pharmaceutical Distribution Company — Central Branch');

    await page.evaluate(() => window.__smilodonReactCertification?.update({ placeholder: 'Updated by React' }));

    await expect(page.locator('#controlled-value')).toHaveText('issue121-long');
    await expect(input).toHaveValue('International Pharmaceutical Distribution Company — Central Branch');
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText('International Pharmaceutical Distribution Company — Central Branch');
    expect(await page.evaluate(() => window.__smilodonReactCertification?.selectedValues())).toEqual(['issue121-long']);
  });

  test('Issue #119: nested custom arrow clicks toggle once and report one callback per transition', async ({ page }) => {
    await page.goto(`${fixtureUrl}?scenario=issue-119-custom-arrow`);
    await waitForReactReady(page);
    await page.evaluate(() => window.__smilodonReactCertification?.clearEvents());

    const host = page.locator('enhanced-select');
    const icon = host.locator('[slot="arrow"] [data-testid="issue119-custom-chevron"]');
    const path = icon.locator('path');
    await expect(icon).toBeAttached();
    await expect(host).toHaveAttribute('data-custom-arrow', 'true');
    await expect(host).not.toHaveAttribute('data-open');

    await path.click();
    await expect(host).toHaveAttribute('data-open', 'true');
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'open').length)
      .toBe(1);
    expect((await readEvents(page)).filter((event) => event.type === 'close')).toHaveLength(0);

    await path.click();
    await expect(host).not.toHaveAttribute('data-open');
    await expect.poll(async () => (await readEvents(page)).filter((event) =>
      event.type === 'open' || event.type === 'close').map((event) => event.type))
      .toEqual(['open', 'close']);
    await page.waitForTimeout(200);
    await expect(host).not.toHaveAttribute('data-open');
    expect((await readEvents(page)).filter((event) =>
      event.type === 'open' || event.type === 'close').map((event) => event.type))
      .toEqual(['open', 'close']);

    await path.click();
    await expect(host).toHaveAttribute('data-open', 'true');
    await expect.poll(async () => (await readEvents(page)).filter((event) =>
      event.type === 'open' || event.type === 'close').map((event) => event.type))
      .toEqual(['open', 'close', 'open']);
    expect((await readEvents(page)).filter((event) => event.type === 'change')).toHaveLength(0);
    await expect(page.locator('#controlled-value')).toHaveText('apple');
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

  test('Issue #120: forwards independent content and arrow padding tokens through the React host @react-adapter', async ({ page }) => {
    const host = page.locator('enhanced-select.react-certification-select');
    await host.evaluate((element) => {
      element.style.setProperty('--select-input-content-padding', '3px 7px');
      element.style.setProperty('--select-dropdown-arrow-container-padding', '2px 5px');
    });
    const result = await host.evaluate((element) => {
      const root = element.shadowRoot!;
      const content = getComputedStyle(root.querySelector('.input-content')!);
      const arrow = getComputedStyle(root.querySelector('.dropdown-arrow-container')!);
      return {
        content: [content.paddingTop, content.paddingRight, content.paddingBottom, content.paddingLeft],
        arrow: [arrow.paddingTop, arrow.paddingRight, arrow.paddingBottom, arrow.paddingLeft],
      };
    });
    expect(result).toEqual({
      content: ['3px', '7px', '3px', '7px'],
      arrow: ['2px', '5px', '2px', '5px'],
    });
  });

  test('clears stale custom active classes after selecting Tehran Darou and reopening', async ({ page }) => {
    await page.goto(`${fixtureUrl}?scenario=issue-82-active-class`);
    await waitForReactReady(page);

    const host = page.locator('enhanced-select');
    const dana = host.locator('[data-index="1"]');
    const tehran = host.locator('[data-index="3"]');
    await host.evaluate((element) => {
      const style = document.createElement('style');
      style.textContent = `
        .option { background-color: rgb(240, 240, 240) !important; }
        .option.issue82-active { background-color: rgb(20, 180, 60) !important; }
      `;
      element.shadowRoot?.append(style);
    });

    const input = host.locator('input');
    await input.click();
    await input.press('ArrowDown');
    await input.press('ArrowDown');
    await expect(dana).toHaveClass(/issue82-active/);
    await expect.poll(() => dana.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgb(20, 180, 60)');

    await tehran.click();
    await input.click();

    await expect(tehran).toHaveClass(/issue82-active/);
    await expect.poll(async () => host.locator('[data-sm-state~="active"]').count()).toBe(1);
    await expect(host.locator('[data-sm-state~="active"]')).toHaveAttribute('data-index', '3');
    await expect(dana).toHaveAttribute('aria-selected', 'false');
    await expect(dana).not.toHaveClass(/(?:^|\s)(?:active|sm-active|smilodon-option--active|issue82-active)(?:\s|$)/);
    await expect.poll(async () =>
      (await dana.getAttribute('data-sm-state'))?.split(/\s+/).includes('active') ?? false,
    ).toBe(false);
    await expect.poll(() => dana.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgb(240, 240, 240)');
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

  test('projects React busy slots through Shadow DOM and retains them during a large load-more projection', async ({ page }) => {
    await page.goto(`${fixtureUrl}?scenario=busy-bucket&busy-mode=replace`);
    await waitForReactReady(page);

    const initialRequest = (await readEvents(page)).find((event) => event.type === 'search')?.request as {
      requestId: string;
      queryGeneration: number;
    };
    expect(await page.evaluate((request) => window.__smilodonReactCertification?.complete({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
      ],
      hasMore: true,
      nextCursor: 'cursor-one',
    }), initialRequest)).toBe('accepted');
    await expect.poll(() => page.evaluate(() => window.__smilodonReactCertification?.state()?.busy))
      .toBe(false);

    await page.evaluate(() => window.__smilodonReactCertification?.open());
    await expect.poll(async () => (await readEvents(page)).filter((event) => event.type === 'loadMore').length)
      .toBe(1);
    const loadRequest = (await readEvents(page)).find((event) => event.type === 'loadMore')?.request as {
      requestId: string;
      queryGeneration: number;
    };
    const host = page.locator('enhanced-select');
    const listbox = host.locator('[role="listbox"]');
    const bucket = host.locator('.busy-bucket');
    await expect(bucket).toBeVisible();
    await expect(listbox).toHaveAttribute('aria-busy', 'true');
    await expect(bucket).toHaveClass(/busy-bucket--replace/);
    await expect(bucket.locator('[part="loading-icon"]')).toBeHidden();
    await expect(bucket.locator('[part="loading-message"]')).toBeHidden();
    await expect(host.locator('[slot="loading-content"]')).toContainText('Loading another page');
    expect(await host.locator('[slot="loading-icon"]').count()).toBe(1);
    expect(await host.locator('[slot="loading-content"]').count()).toBe(1);

    const nextPage = Array.from({ length: 360 }, (_, index) => ({
      value: `page-two-${index}`,
      label: `Page two option ${index}`,
    }));
    expect(await page.evaluate(({ request, items }) => window.__smilodonReactCertification?.complete({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'exhausted',
      items,
      hasMore: false,
    }), { request: loadRequest, items: nextPage })).toBe('accepted');

    await expect.poll(() => page.evaluate(() => window.__smilodonReactCertification?.state()?.busy))
      .toBe(false);
    await expect.poll(async () => host.locator('[part="option"]').count()).toBeGreaterThan(300);
    await expect(listbox).not.toHaveAttribute('aria-busy', 'true');
    await expect(bucket).toBeVisible();
    await expect(host.locator('.busy-bucket')).toHaveCount(1);
    await expect(host.locator('[slot="loading-content"]')).toContainText('Loading another page');
    await expect(bucket.locator('[part="loading-spinner"]')).toBeHidden();

    await expect(bucket).toHaveCount(0, { timeout: 2000 });
  });

  test('removes the icon row from layout when spinner and custom icon are absent', async ({ page }) => {
    await page.goto(`${fixtureUrl}?scenario=busy-bucket&busy-icon=none`);
    await waitForReactReady(page);

    const host = page.locator('enhanced-select');
    const bucket = host.locator('.busy-bucket');
    await host.evaluate((element) => {
      const select = element as HTMLElement & {
        _state: { isSearching: boolean };
        _setBusy(busy: boolean): void;
        setItems(items: Array<{ value: string; label: string }>): void;
      };
      select._state.isSearching = false;
      select.setItems([{ value: 'apple', label: 'Apple' }]);
    });
    await page.evaluate(() => window.__smilodonReactCertification?.open());
    await host.evaluate((element) => {
      const select = element as HTMLElement & { _setBusy(busy: boolean): void };
      select._setBusy(true);
    });
    const icon = bucket.locator('.busy-icon');
    await expect(bucket).toBeVisible();
    await expect(bucket.locator('[part="loading-spinner"]')).toHaveCount(0);
    await expect(host.locator('[slot="loading-icon"]')).toHaveCount(0);
    await expect(icon).toBeHidden();

    const iconBox = await icon.boundingBox();
    expect(iconBox).toBeNull();
    await expect(bucket.locator('[part="loading-message"]')).toBeVisible();
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

test('keeps acknowledged pages and latest-chip scroll through fresh equivalent React props @react-adapter', async ({ page }) => {
  await page.addInitScript(() => {
    window.IntersectionObserver = class implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '0px';
      readonly thresholds: readonly number[] = [];
      observe(_target: Element): void {}
      unobserve(_target: Element): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] { return []; }
    };
  });
  await page.goto(`${fixtureUrl}?scenario=issue-107`);
  await waitForReactReady(page);
  const host = page.locator('enhanced-select');
  const events = async () => readEvents(page);
  const requestFrom = async (type: string, occurrence: number) => {
    const event = (await events()).filter((entry) => entry.type === type)[occurrence];
    return event?.request as { requestId: string; queryGeneration: number };
  };
  const complete = async (
    request: { requestId: string; queryGeneration: number },
    items: Array<{ value: string; label: string; metadata: { ordinal: number } }>,
  ) => page.evaluate(({ request, items }) => window.__smilodonReactCertification?.complete({
    requestId: request.requestId,
    queryGeneration: request.queryGeneration,
    status: 'succeeded',
    items,
    hasMore: true,
  }), { request, items });
  const waitForProjection = async (count: number) => {
    await expect.poll(async () => (await events()).filter((event) => event.type === 'projection').length)
      .toBe(count);
  };

  const firstPage = Array.from({ length: 6 }, (_, index) => ({
    value: `issue107-${index + 1}`,
    label: `Issue 107 option ${index + 1}`,
    metadata: { ordinal: index + 1 },
  }));
  const firstRequest = await requestFrom('search', 0);
  expect(await complete(firstRequest, firstPage)).toBe('accepted');
  await waitForProjection(1);
  await page.evaluate(() => window.__smilodonReactCertification?.open());

  const cumulative = [...firstPage];
  for (let pageNumber = 2; pageNumber <= 3; pageNumber += 1) {
    await host.locator('.load-more-button').click();
    await expect.poll(async () => (await events()).filter((event) => event.type === 'loadMore').length)
      .toBe(pageNumber - 1);
    const pageRequest = await requestFrom('loadMore', pageNumber - 2);
    const nextPage = Array.from({ length: 6 }, (_, index) => {
      const ordinal = (pageNumber - 1) * 6 + index + 1;
      return {
        value: `issue107-${ordinal}`,
        label: `Issue 107 option ${ordinal}`,
        metadata: { ordinal },
      };
    });
    cumulative.push(...nextPage);
    expect(await complete(pageRequest, cumulative)).toBe('accepted');
    await waitForProjection(pageNumber);
  }

  await expect.poll(() => host.evaluate((element: any) => element.loadedItems.length)).toBe(18);
  await page.locator('#issue107-rerender').click();
  await expect.poll(() => host.evaluate((element: any) => element.loadedItems.length)).toBe(18);
  await expect(host.locator('select-option')).toHaveCount(18);

  await page.evaluate(() => window.__smilodonReactCertification?.open());
  await host.evaluate((element: any) => {
    const latestOption = element.shadowRoot?.querySelector('[data-value="issue107-18"]') as HTMLElement | null;
    if (!latestOption) throw new Error('The third-page option is not rendered');
    latestOption.click();
  });
  await expect(page.locator('#issue107-selected')).toHaveText('issue107-18');
  await expect.poll(() => host.evaluate((element: any) => {
    const viewport = element._inputContent as HTMLElement;
    const chip = viewport.querySelectorAll<HTMLElement>('.selection-badge').item(0);
    if (!chip) return false;
    const viewportBounds = viewport.getBoundingClientRect();
    const chipBounds = chip.getBoundingClientRect();
    return chipBounds.left >= viewportBounds.left - 1 && chipBounds.right <= viewportBounds.right + 1;
  })).toBe(true);
  await expect.poll(() => host.evaluate((element: any) => element.loadedItems.length)).toBe(18);
  expect(await page.evaluate(() => window.__smilodonReactCertification?.state()?.nextEligiblePosition))
    .toEqual({ mode: 'page', page: 4 });
});

test('keeps later-page custom React content through controlled selection and equivalent source rerenders @react-adapter', async ({ page }) => {
  await page.goto(`${fixtureUrl}?scenario=issue-112`);
  await waitForReactReady(page);
  const host = page.locator('enhanced-select');
  const events = async () => readEvents(page);
  const requestFrom = async (type: string, occurrence: number) => {
    const event = (await events()).filter((entry) => entry.type === type)[occurrence];
    return event?.request as { requestId: string; queryGeneration: number };
  };
  const cumulative = Array.from({ length: 6 }, (_, index) => ({
    value: `issue112-${index + 1}`,
    label: `Issue 112 option ${index + 1}`,
  }));
  const completePage = async (
    request: { requestId: string; queryGeneration: number },
    items: Array<{ value: string; label: string }>,
    finalPage: boolean,
  ) => page.evaluate(({ request, items, finalPage }) => {
    const completion = finalPage
      ? { status: 'exhausted' as const, hasMore: false as const }
      : { status: 'succeeded' as const, hasMore: true as const };
    return window.__smilodonReactCertification?.complete({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      ...completion,
      items,
    });
  }, { request, items, finalPage });
  const waitForRenderedItems = async (count: number) => {
    await expect(host.locator('[role="option"]')).toHaveCount(count);
    for (let index = 1; index <= count; index += 1) {
      await expect(host.locator(`[data-testid="issue112-custom-issue112-${index}"]`))
        .toHaveText(`Custom Issue 112 option ${index}`);
    }
  };

  const firstRequest = await requestFrom('search', 0);
  expect(await completePage(firstRequest, cumulative, false)).toBe('accepted');
  await expect.poll(async () => (await events()).filter((event) => event.type === 'projection').length)
    .toBe(1);
  await page.evaluate(() => window.__smilodonReactCertification?.open());
  await waitForRenderedItems(6);

  for (let pageNumber = 2; pageNumber <= 3; pageNumber += 1) {
    const loadMore = host.locator('.load-more-button');
    await loadMore.focus();
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await events()).filter((event) => event.type === 'loadMore').length)
      .toBe(pageNumber - 1);
    const request = await requestFrom('loadMore', pageNumber - 2);
    const nextPage = Array.from({ length: 6 }, (_, index) => {
      const ordinal = (pageNumber - 1) * 6 + index + 1;
      return {
        value: `issue112-${ordinal}`,
        label: `Issue 112 option ${ordinal}`,
      };
    });
    cumulative.push(...nextPage);
    expect(await completePage(request, cumulative, pageNumber === 3)).toBe('accepted');
    await expect.poll(async () => (await events()).filter((event) => event.type === 'projection').length)
      .toBe(pageNumber);
    await page.evaluate(() => window.__smilodonReactCertification?.open());
    await waitForRenderedItems(pageNumber * 6);
  }

  await page.evaluate(() => window.__smilodonReactCertification?.open());
  await host.locator('[data-value="issue112-8"]').click();
  await expect(page.locator('#issue112-selected')).toHaveText('issue112-1,issue112-8');
  await expect(host.locator('[data-value="issue112-1"][aria-selected="true"]')).toBeAttached();
  await expect(host.locator('[data-value="issue112-8"][aria-selected="true"]')).toBeAttached();
  await waitForRenderedItems(18);

  await page.locator('#issue112-rerender').click();
  await expect(page.locator('#issue112-selected')).toHaveText('issue112-1,issue112-8');
  await waitForRenderedItems(18);
});
