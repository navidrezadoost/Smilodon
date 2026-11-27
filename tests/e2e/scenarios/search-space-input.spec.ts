import { expect, test, type Locator, type Page } from '@playwright/test';

const fixtureUrl = 'http://localhost:5173/vanilla-demo.html';
const items = [
  { value: 'north-pharma', label: 'North Pharma' },
  { value: 'north-medical', label: 'North Medical' },
  { value: 'south-pharma', label: 'South Pharma' },
];

async function createSelect(
  page: Page,
  id: string,
  mode: 'single' | 'multi',
  selected: string[] = [],
  dataLoading?: Record<string, unknown>,
) {
  await page.evaluate(async ({ id, mode, selected, items, dataLoading }) => {
    await customElements.whenDefined('enhanced-select');
    const host = document.createElement('enhanced-select') as any;
    host.id = id;
    host.style.cssText = 'display:block;width:320px;margin:12px 0;';
    host.updateConfig({ searchable: true, selection: { mode }, ...(dataLoading ? { dataLoading } : {}) } as any);
    document.body.append(host);
    await host.setItems(items);
    if (selected.length) await host.setSelectedValues(selected);
    (window as any).__issue123Events = [];
    for (const type of ['input', 'select', 'change', 'search', 'dataRequestCancel']) {
      const target = type === 'input' ? host.shadowRoot.querySelector('[part="input"]') : host;
      target.addEventListener(type, (event: Event) => {
        (window as any).__issue123Events.push({
          type,
          value: type === 'input' ? (event.target as HTMLInputElement).value : undefined,
          detail: type === 'input' ? undefined : (event as CustomEvent).detail,
        });
      });
    }
    if (dataLoading) host.startDataLoading();
  }, { id, mode, selected, items, dataLoading });
  return page.locator(`#${id}`);
}

function searchInput(host: Locator): Locator {
  return host.locator('[part="input"]');
}

test.describe('Space editing in searchable inputs #123 @all', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixtureUrl);
  });

  test('Space inserts into a single-select query without activating an option', async ({ page }) => {
    const host = await createSelect(page, 'issue123-single', 'single');
    const input = searchInput(host);
    await host.evaluate((element: any) => element.open());
    await input.fill('North');
    await input.press('Space');
    await expect(input).toHaveValue('North ');
    await expect.poll(() => host.evaluate((element: any) => element._state.searchQuery)).toBe('North ');
    await input.type('Pharma');
    await expect(input).toHaveValue('North Pharma');
    await expect.poll(() => host.evaluate((element: any) => element._state.searchQuery)).toBe('North Pharma');
    await expect(host.locator('select-option[data-value="north-pharma"]')).toHaveCount(1);
    expect(await host.evaluate((element: any) => ({
      selected: element.getSelectedValues(),
      open: element._state.isOpen,
      events: (window as any).__issue123Events.filter((event: any) => ['select', 'change'].includes(event.type)),
    }))).toEqual({ selected: [], open: true, events: [] });
  });

  test('Space edits selected multi-select input without changing chips', async ({ page }) => {
    const host = await createSelect(page, 'issue123-multi', 'multi', ['south-pharma']);
    const input = searchInput(host);
    await host.evaluate((element: any) => element.open());
    await input.fill('North');
    await input.press('Space');
    await expect(input).toHaveValue('North ');
    await expect.poll(() => host.evaluate((element: any) => element._state.searchQuery)).toBe('North ');
    expect(await host.evaluate((element: any) => element.getSelectedValues())).toEqual(['south-pharma']);
    await expect(host.locator('select-option[data-value="north-pharma"]')).toHaveCount(1);
  });

  test('Space does not activate an already active option', async ({ page }) => {
    const host = await createSelect(page, 'issue123-active-option', 'single');
    const input = searchInput(host);
    await host.evaluate((element: any) => element.open());
    await input.fill('North');
    await input.press('ArrowDown');
    expect(await host.evaluate((element: any) => element._state.activeIndex)).toBe(0);
    await input.press('Space');
    await expect(input).toHaveValue('North ');
    await expect.poll(() => host.evaluate((element: any) => element._state.searchQuery)).toBe('North ');
    expect(await host.evaluate((element: any) => ({
      selected: element.getSelectedValues(),
      open: element._state.isOpen,
    }))).toEqual({ selected: [], open: true });
  });

  test('Space inserts at the caret and replaces selected text using native editing', async ({ page }) => {
    const host = await createSelect(page, 'issue123-caret', 'single');
    const input = searchInput(host);
    await host.evaluate((element: any) => element.open());
    await input.fill('North');
    await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(0, 0));
    await input.press('Space');
    await expect(input).toHaveValue(' North');
    await input.press('Control+A');
    await input.press('Space');
    await expect(input).toHaveValue(' ');
    await expect.poll(() => host.evaluate((element: any) => element._state.searchQuery)).toBe(' ');
    expect(await host.evaluate((element: any) => element.getSelectedValues())).toEqual([]);
  });

  test('Space at the middle and end preserves repeated whitespace in the query', async ({ page }) => {
    const host = await createSelect(page, 'issue123-middle', 'single');
    const input = searchInput(host);
    await host.evaluate((element: any) => element.open());
    await input.fill('NorthPharma');
    await input.evaluate((element: HTMLInputElement) => element.setSelectionRange('North'.length, 'North'.length));
    await input.press('Space');
    await input.press('Space');
    await input.evaluate((element: HTMLInputElement) => {
      const end = element.value.length;
      element.setSelectionRange(end, end);
    });
    await input.press('Space');
    await expect(input).toHaveValue('North  Pharma ');
    await expect.poll(() => host.evaluate((element: any) => element._state.searchQuery)).toBe('North  Pharma ');
    expect(await host.evaluate((element: any) => element.getSelectedValues())).toEqual([]);
  });

  test('acknowledged remote search keeps raw whitespace and advances query generation', async ({ page }) => {
    const host = await createSelect(page, 'issue123-remote', 'multi', [], {
      protocol: 'acknowledged',
      searchMode: 'remote',
      paginationMode: 'page',
      fetchLimit: 3,
      minSearchCharacters: 20,
    });
    await expect.poll(() => host.evaluate((element: any) => element._acknowledgedReady)).toBe(true);
    const input = searchInput(host);
    await input.fill('North');
    const generationBeforeSpace = await host.evaluate((element: any) => element.getDataLoadingState().queryGeneration);
    await input.press('Space');
    await expect(input).toHaveValue('North ');
    await expect.poll(() => host.evaluate((element: any) => element._state.searchQuery)).toBe('North ');
    expect(await host.evaluate((element: any) => ({
      queryGeneration: element.getDataLoadingState().queryGeneration,
      selected: element.getSelectedValues(),
      cancellations: (window as any).__issue123Events.filter((event: any) => event.type === 'dataRequestCancel'),
    }))).toEqual({ queryGeneration: generationBeforeSpace + 1, selected: [], cancellations: [] });
  });

  test('Space in a focused searchable input does not activate an option before the popup opens', async ({ page }) => {
    const host = await createSelect(page, 'issue123-closed', 'single');
    const input = searchInput(host);
    await host.evaluate((element: any) => element.close());
    await input.press('Space');
    await expect(input).toHaveValue(' ');
    await expect.poll(() => host.evaluate((element: any) => element._state.searchQuery)).toBe(' ');
    expect(await host.evaluate((element: any) => ({ selected: element.getSelectedValues(), open: element._state.isOpen })))
      .toEqual({ selected: [], open: true });
  });

  test('Enter still activates an active searchable option', async ({ page }) => {
    const host = await createSelect(page, 'issue123-enter', 'single');
    const input = searchInput(host);
    await host.evaluate((element: any) => element.open());
    await input.fill('North');
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect.poll(() => host.evaluate((element: any) => element.getSelectedValues())).toEqual(['north-pharma']);
    expect(await host.evaluate((element: any) => element._state.isOpen)).toBe(false);
  });

  test('non-searchable Space activation and #122 Ctrl+A text replacement remain compatible', async ({ page }) => {
    const nonSearchable = await createSelect(page, 'issue123-nonsearchable', 'single');
    const nonSearchInput = searchInput(nonSearchable);
    await nonSearchable.evaluate((element: any) => {
      element.updateConfig({ searchable: false });
      element.open();
    });
    await nonSearchInput.press('ArrowDown');
    await nonSearchInput.press('Space');
    await expect.poll(() => nonSearchable.evaluate((element: any) => element.getSelectedValues())).toEqual(['north-pharma']);

    const searchable = await createSelect(page, 'issue123-ctrl-a', 'multi', ['south-pharma']);
    const input = searchInput(searchable);
    await searchable.evaluate((element: any) => element.open());
    await input.fill('North');
    await input.press('Control+A');
    await input.press('Space');
    await expect(input).toHaveValue(' ');
    await expect.poll(() => searchable.evaluate((element: any) => element._state.searchQuery)).toBe(' ');
    expect(await searchable.evaluate((element: any) => element.getSelectedValues())).toEqual(['south-pharma']);
  });
});
