import { expect, test, type Locator, type Page } from '@playwright/test';

const fixtureUrl = 'http://localhost:5173/vanilla-demo.html';
const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

async function createSelect(page: Page, id: string, mode: 'single' | 'multi', selected: string[]) {
  await page.evaluate(async ({ id, mode, selected, items }) => {
    await customElements.whenDefined('enhanced-select');
    const host = document.createElement('enhanced-select') as any;
    host.id = id;
    host.style.cssText = 'display:block;width:320px;margin:12px 0;';
    host.updateConfig({ searchable: true, selection: { mode } });
    document.body.append(host);
    await host.setItems(items);
    if (selected.length) await host.setSelectedValues(selected);
  }, { id, mode, selected, items });
  return page.locator(`#${id}`);
}

function searchInput(host: Locator): Locator {
  return host.locator('[part="input"]');
}

test.describe('Native select-all in searchable inputs #122 @all', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixtureUrl);
  });

  test('Ctrl+A selects only the query; deleting it restores options and clears no-results immediately', async ({ page }) => {
    const host = await createSelect(page, 'issue122-selected-chips', 'multi', ['apple', 'banana']);
    const input = searchInput(host);
    const query = 'nonexistent-product';
    await input.fill(query);
    await expect.poll(() => host.evaluate((element: any) => element.getEmptyStateContext()))
      .toEqual({ query, reason: 'no-results' });

    await host.evaluate((element: any) => {
      const input = element.shadowRoot.querySelector('[part="input"]');
      (window as any).__issue122Events = [];
      input.addEventListener('input', (event: Event) => {
        (window as any).__issue122Events.push({ type: 'input', value: (event.target as HTMLInputElement).value });
      });
      for (const type of ['select', 'change', 'search', 'dataRequestCancel']) {
        element.addEventListener(type, (event: Event) => {
          (window as any).__issue122Events.push({ type, detail: (event as CustomEvent).detail });
        });
      }
    });
    await input.press('Control+A');
    const afterSelectAll = await host.evaluate((element: any) => {
      const input = element.shadowRoot.querySelector('[part="input"]');
      return {
        value: input.value,
        selectionStart: input.selectionStart,
        selectionEnd: input.selectionEnd,
        selected: element.getSelectedValues(),
        context: element.getEmptyStateContext(),
        events: (window as any).__issue122Events,
      };
    });
    await input.press('Backspace');
    await expect.poll(() => host.evaluate((element: any) => element.shadowRoot.querySelector('[part="input"]').value)).toBe('');
    const afterDelete = await host.evaluate((element: any) => ({
      value: element.shadowRoot.querySelector('[part="input"]').value,
      selected: element.getSelectedValues(),
      query: element._state.searchQuery,
      context: element.getEmptyStateContext(),
      optionValues: Array.from(element.shadowRoot.querySelectorAll('select-option[part="option"]'))
        .map((option: any) => option.getAttribute('data-value')),
      events: (window as any).__issue122Events,
    }));
    await host.evaluate((element: any) => { element.close(); element.open(); });
    const afterReopen = await host.evaluate((element: any) => ({
      context: element.getEmptyStateContext(),
      optionsHtml: element.shadowRoot.querySelector('.options-container').innerHTML,
    }));

    expect(afterSelectAll.value).toBe(query);
    expect(afterSelectAll.selectionStart).toBe(0);
    expect(afterSelectAll.selectionEnd).toBe(query.length);
    expect(afterSelectAll.selected).toEqual(['apple', 'banana']);
    expect(afterSelectAll.events).toEqual([]);
    expect(afterDelete.value).toBe('');
    expect(afterDelete.query).toBe('');
    expect(afterDelete.selected).toEqual(['apple', 'banana']);
    expect(afterDelete.context).toBeNull();
    expect(afterDelete.optionValues).toEqual(['apple', 'banana', 'cherry']);
    expect(afterDelete.events.some((event: any) => event.type === 'input' && event.value === '')).toBe(true);
    expect(afterReopen.context).toBeNull();
    expect(afterReopen.optionsHtml).toContain('data-value="apple"');
    expect(afterReopen.optionsHtml).toContain('data-value="banana"');
    expect(afterReopen.optionsHtml).toContain('data-value="cherry"');
  });

  test('a fresh searchable multi-select with no chips restores options after Ctrl+A and Backspace', async ({ page }) => {
    const host = await createSelect(page, 'issue122-no-chips', 'multi', []);
    const input = searchInput(host);
    await input.fill('no such item');
    await expect.poll(() => host.evaluate((element: any) => element.getEmptyStateContext()))
      .toEqual({ query: 'no such item', reason: 'no-results' });
    await input.press('Control+A');
    await expect(input).toHaveValue('no such item');
    expect(await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd]))
      .toEqual([0, 'no such item'.length]);
    await input.press('Backspace');
    await expect.poll(() => host.evaluate((element: any) => ({
      query: element._state.searchQuery,
      context: element.getEmptyStateContext(),
      count: element.shadowRoot.querySelectorAll('select-option[part="option"]').length,
    }))).toEqual({ query: '', context: null, count: 3 });
  });

  test('search remains editable after every selected chip is removed', async ({ page }) => {
    const host = await createSelect(page, 'issue122-removed-chips', 'multi', ['apple', 'banana']);
    await host.evaluate((element: any) => element.setSelectedValues([]));
    const input = searchInput(host);
    await input.fill('no matching option');
    await expect.poll(() => host.evaluate((element: any) => element.getEmptyStateContext()))
      .toEqual({ query: 'no matching option', reason: 'no-results' });
    await input.press('Control+A');
    await expect(input).toHaveValue('no matching option');
    expect(await host.evaluate((element: any) => element.getSelectedValues())).toEqual([]);
    await input.press('Backspace');
    await expect.poll(() => host.evaluate((element: any) => ({
      query: element._state.searchQuery,
      context: element.getEmptyStateContext(),
      count: element.shadowRoot.querySelectorAll('select-option[part="option"]').length,
    }))).toEqual({ query: '', context: null, count: 3 });
  });

  test('searchable single-select retains normal Ctrl+A text editing behavior', async ({ page }) => {
    const host = await createSelect(page, 'issue122-single-select', 'single', ['apple']);
    const input = searchInput(host);
    await input.fill('missing single result');
    await expect.poll(() => host.evaluate((element: any) => element.getEmptyStateContext()))
      .toEqual({ query: 'missing single result', reason: 'no-results' });
    await input.press('Control+A');
    await expect(input).toHaveValue('missing single result');
    expect(await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd]))
      .toEqual([0, 'missing single result'.length]);
    await input.press('Backspace');
    await expect.poll(() => host.evaluate((element: any) => ({
      query: element._state.searchQuery,
      context: element.getEmptyStateContext(),
      count: element.shadowRoot.querySelectorAll('select-option[part="option"]').length,
    }))).toEqual({ query: '', context: null, count: 3 });
  });

  test('Ctrl+A on an empty searchable multi-select input emits no selection transition', async ({ page }) => {
    const host = await createSelect(page, 'issue122-empty-input', 'multi', ['apple', 'banana']);
    const input = searchInput(host);
    const before = await host.evaluate((element: any) => element.getSelectedValues());
    await host.evaluate((element: any) => {
      (window as any).__issue122Events = [];
      for (const type of ['select', 'change', 'search', 'dataRequestCancel']) {
        element.addEventListener(type, () => (window as any).__issue122Events.push(type));
      }
    });
    await input.focus();
    await input.press('Control+A');
    expect(await host.evaluate((element: any) => element.getSelectedValues())).toEqual(before);
    expect(await page.evaluate(() => (window as any).__issue122Events)).toEqual([]);
    await expect(input).toHaveValue('');
  });
});
