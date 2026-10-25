import { expect, test } from '@playwright/test';

const playgroundUrl = 'http://localhost:5173/vanilla-demo.html';

test('public core facade gates readiness and separates synchronous acceptance from browser projection', async ({ page }) => {
  await page.goto(playgroundUrl);
  await page.waitForLoadState('networkidle');
  const initial = await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'phase2f-public-facade-under-test';
    select.updateConfig({
      searchable: true,
      infiniteScroll: { enabled: true, pageSize: 4 },
      dataLoading: { protocol: 'acknowledged', searchMode: 'remote' },
    });
    const requests: any[] = [];
    const projections: any[] = [];
    (window as any).__phase2fPublicFacade = { requests, projections };
    select.addEventListener('search', (event: CustomEvent) => requests.push(event.detail));
    select.addEventListener('dataProjection', (event: CustomEvent) => projections.push(event.detail));
    document.body.appendChild(select);

    const beforeStart = requests.length;
    select.startDataLoading();
    const request = requests[0].request;
    const completionResult = select.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [
        { value: 'one', label: 'One' },
        { value: 'two', label: 'Two' },
      ],
      hasMore: true,
    });
    return {
      beforeStart,
      request,
      completionResult,
      immediateState: select.getDataLoadingState(),
      listboxBusy: select.shadowRoot.querySelector('[role="listbox"]')?.getAttribute('aria-busy'),
    };
  });

  expect(initial.beforeStart).toBe(0);
  expect(initial.request.position).toEqual({ mode: 'page', page: 1 });
  expect(initial.request.fetchLimit).toBe(4);
  expect(initial.completionResult).toBe('accepted');
  expect(initial.immediateState).toMatchObject({ busy: true, projectionPending: true });
  expect(initial.listboxBusy).toBe('true');

  await expect.poll(() => page.evaluate(() =>
    (window as any).__phase2fPublicFacade.projections.length,
  )).toBe(1);
  const final = await page.evaluate(() => {
    const select = document.querySelector('#phase2f-public-facade-under-test') as any;
    const report = (window as any).__phase2fPublicFacade;
    return {
      projection: report.projections[0],
      state: select.getDataLoadingState(),
      listboxBusy: select.shadowRoot.querySelector('[role="listbox"]')?.getAttribute('aria-busy'),
    };
  });
  expect(final.projection).toMatchObject({
    requestId: initial.request.requestId,
    queryGeneration: initial.request.queryGeneration,
    attempt: 1,
    status: 'complete',
  });
  expect(final.state).toMatchObject({ busy: false, projectionPending: false, activeRequest: null });
  expect(final.listboxBusy).toBeNull();
  const select = page.locator('#phase2f-public-facade-under-test');
  await select.evaluate((element: any) => element.open());
  await expect(select.getByRole('option', { name: 'One' })).toBeVisible();
  await expect(select.getByRole('option', { name: 'Two' })).toBeVisible();
});
