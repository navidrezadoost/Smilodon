import { expect, test } from '@playwright/test';

const playgroundUrl = 'http://localhost:5173/vanilla-demo.html';

test('@vanilla keeps browse pagination while acknowledged searches are below threshold', async ({ page }) => {
  await page.goto(playgroundUrl);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'issue109-min-search';
    select.updateConfig({
      searchable: true,
      // Keep the browser test deterministic: exercise manual pagination below
      // without an in-view sentinel starting a concurrent request.
      infiniteScroll: { enabled: false, pageSize: 6 },
      loadMore: { enabled: true, itemsPerLoad: 6 },
      dataLoading: {
        protocol: 'acknowledged',
        searchMode: 'remote',
        paginationMode: 'page',
        firstPage: 1,
        fetchLimit: 6,
        minSearchCharacters: 3,
      },
    });
    select.setItems(Array.from({ length: 6 }, (_, index) => ({
      value: `browse-${index + 1}`,
      label: `Browse ${index + 1}`,
    })));
    const report = { searches: [] as any[], loads: [] as any[], cancellations: [] as any[], projections: [] as any[] };
    (window as any).__issue109 = { select, report };
    select.addEventListener('search', (event: CustomEvent) => report.searches.push(event.detail));
    select.addEventListener('loadMore', (event: CustomEvent) => report.loads.push(event.detail));
    select.addEventListener('dataRequestCancel', (event: CustomEvent) => report.cancellations.push(event.detail));
    select.addEventListener('dataProjection', (event: CustomEvent) => report.projections.push(event.detail));
    document.body.append(select);
    select.startDataLoading();
  });

  const select = page.locator('#issue109-min-search');
  const input = select.locator('input[role="combobox"]');
  await expect.poll(() => page.evaluate(() => (window as any).__issue109.select._acknowledgedReady)).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__issue109.select.getDataLoadingState().busy)).toBe(false);
  expect(await page.evaluate(() => (window as any).__issue109.report.searches.length)).toBe(0);

  await input.fill('a');
  await input.fill('ab');
  await expect.poll(() => page.evaluate(() => ({
    searches: (window as any).__issue109.report.searches.length,
    busy: (window as any).__issue109.select.getDataLoadingState().busy,
  }))).toEqual({ searches: 0, busy: false });

  await page.evaluate(() => (window as any).__issue109.select._loadMoreItems('manual'));
  await expect.poll(() => page.evaluate(() => (window as any).__issue109.report.loads.length)).toBe(1);
  const browseRequest = await page.evaluate(() => (window as any).__issue109.report.loads[0].request);
  expect(browseRequest).toMatchObject({ kind: 'loadMore', queryGeneration: expect.any(Number), position: { mode: 'page', page: 2 } });
  await page.evaluate(async (request) => {
    const { select } = (window as any).__issue109;
    const projected = new Promise<void>((resolve) => {
      select.addEventListener('dataProjection', (event: CustomEvent) => {
        if (event.detail.status === 'complete') resolve();
      }, { once: true });
    });
    select.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: Array.from({ length: 12 }, (_, index) => ({ value: `browse-${index + 1}`, label: `Browse ${index + 1}` })),
      hasMore: true,
    });
    await projected;
  }, browseRequest);

  await input.fill('abc');
  await expect.poll(() => page.evaluate(() => (window as any).__issue109.report.searches.length)).toBe(1);
  const searchRequest = await page.evaluate(() => (window as any).__issue109.report.searches[0].request);
  expect(searchRequest).toMatchObject({ kind: 'search', normalizedQuery: 'abc', position: { mode: 'page', page: 1 } });
  await page.evaluate(async (request) => {
    const { select } = (window as any).__issue109;
    const projected = new Promise<void>((resolve) => {
      select.addEventListener('dataProjection', (event: CustomEvent) => {
        if (event.detail.status === 'complete') resolve();
      }, { once: true });
    });
    select.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'match', label: 'Match' }],
      hasMore: true,
    });
    await projected;
  }, searchRequest);

  await input.fill('ab');
  await expect.poll(() => page.evaluate(() => (window as any).__issue109.select.loadedItems.length)).toBe(12);
  expect(await page.evaluate(() => (window as any).__issue109.select.getDataLoadingState())).toMatchObject({
    busy: false,
    hasMore: true,
    nextEligiblePosition: { mode: 'page', page: 3 },
  });
  expect(await page.evaluate(() => (window as any).__issue109.select.shadowRoot.querySelectorAll('[part="option"]').length)).toBe(12);

  await input.fill('abcd');
  await expect.poll(() => page.evaluate(() => (window as any).__issue109.report.searches.length)).toBe(2);
  const canceledRequest = await page.evaluate(() => (window as any).__issue109.report.searches[1].request);
  await input.fill('ab');
  await expect.poll(() => page.evaluate((requestId) =>
    (window as any).__issue109.report.cancellations.some((entry: any) => entry.requestId === requestId),
  canceledRequest.requestId)).toBe(true);
  const lateResult = await page.evaluate((request) => {
    const { select } = (window as any).__issue109;
    return select.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'stale', label: 'Stale' }],
      hasMore: false,
    });
  }, canceledRequest);
  expect(lateResult).toBe('stale');
  expect(await page.evaluate(() => (window as any).__issue109.select.loadedItems.length)).toBe(12);
});
