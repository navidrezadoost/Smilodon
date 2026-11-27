import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

const items = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Date' },
  { value: 'e', label: 'Elderberry' },
  { value: 'f', label: 'Fig' },
];

describe('selected-option scroll target resolution', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
    select.setItems(items);
  });

  afterEach(() => {
    select.remove();
    vi.restoreAllMocks();
  });

  async function openAndCaptureTarget(
    values: string[],
    target: 'first' | 'last',
    mode: 'single' | 'multi',
    selectedFirst: boolean,
  ): Promise<{ sourceIndex: number | null; selectedBefore: string[] }> {
    await select.updateConfig({ selection: { mode } });
    await select.setSelectedValues(values);
    select.updateConfig({
      scrollToSelected: { enabled: true, multiSelectTarget: target, behavior: 'auto', block: 'center' },
    });
    if (selectedFirst) select.updateConfig({ selectedOptions: { placement: 'selected-first' } });

    select.open();
    (select as any)._cancelOpenSelectedScroll();
    const selectedBefore = [...((select as any)._engine.state.selectedKeys as Set<string>)];
    const positions: number[] = [];
    vi.spyOn(select as any, '_scrollOptionWithinOptionsContainer')
      .mockImplementation((option: unknown) => {
        if (!(option instanceof HTMLElement)) throw new Error('Expected an HTMLElement scroll target');
        positions.push(Number(option.getAttribute('data-sm-index') ?? option.getAttribute('data-index')));
      });

    (select as any)._scrollToSelected({ setActive: false });
    return { sourceIndex: positions[0] ?? null, selectedBefore };
  }

  it.each([
    { mode: 'single' as const, values: ['f'], target: 'first' as const, expected: 5, projected: true },
    { mode: 'single' as const, values: ['f'], target: 'last' as const, expected: 5, projected: true },
    { mode: 'multi' as const, values: ['f', 'c'], target: 'first' as const, expected: 2, projected: false },
    { mode: 'multi' as const, values: ['f', 'c'], target: 'last' as const, expected: 5, projected: false },
    { mode: 'multi' as const, values: ['f', 'c'], target: 'first' as const, expected: 2, projected: true },
    { mode: 'multi' as const, values: ['f', 'c'], target: 'last' as const, expected: 5, projected: true },
  ])('uses configured $target target in $mode mode and preserves source identity', async ({ mode, values, target, expected, projected }) => {
    const result = await openAndCaptureTarget(values, target, mode, projected !== false);

    expect(result.sourceIndex).toBe(expected);
    expect(new Set(result.selectedBefore)).toEqual(new Set(values));
    expect((select as any)._engine.state.selectedKeys).toEqual(new Set(values));
  });

  it('does not scroll when the selected key is outside the eligible filtered projection', async () => {
    await select.setSelectedValues(['f']);
    select.updateConfig({ scrollToSelected: { enabled: true, multiSelectTarget: 'first', behavior: 'auto', block: 'center' } });
    (select as any)._state.searchQuery = 'cherry';
    select.open();
    (select as any)._cancelOpenSelectedScroll();
    const scroll = vi.spyOn(select as any, '_scrollOptionWithinOptionsContainer');

    (select as any)._scrollToSelected({ setActive: false });

    expect((select as any)._renderPlan.filteredKeys).toHaveLength(1);
    expect(scroll).not.toHaveBeenCalled();
  });

  it('materializes an eligible but unmounted key by stable identity', async () => {
    await select.updateConfig({ selection: { mode: 'multi' } });
    await select.setSelectedValues(['f', 'c']);
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    select.updateConfig({ scrollToSelected: { enabled: true, multiSelectTarget: 'first', behavior: 'auto', block: 'center' } });
    select.open();
    (select as any)._cancelOpenSelectedScroll();

    const targetKey = (select as any)._itemRegistry.indexToKey.get(2);
    const option = select.shadowRoot!.querySelector<HTMLElement>('[data-index="2"]')!;
    (select as any)._guardedVirtualizer = { destroy: vi.fn() };
    const materialize = vi.fn();
    (select as any)._materializeGuardedVirtualKey = materialize;
    let lookups = 0;
    (select as any)._getOptionElementByIndex = () => (lookups++ === 0 ? null : option);
    const scroll = vi.spyOn(select as any, '_scrollOptionWithinOptionsContainer');

    (select as any)._scrollToSelected({ setActive: false });

    expect(materialize).toHaveBeenCalledTimes(1);
    expect(materialize).toHaveBeenCalledWith(targetKey);
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledWith(option, 'center', 'auto', false);
  });

  it('resolves the current selection using the opening snapshot order', async () => {
    await select.updateConfig({ selection: { mode: 'multi' } });
    await select.setSelectedValues(['f', 'c']);
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    select.updateConfig({ scrollToSelected: { enabled: true, multiSelectTarget: 'first', behavior: 'auto' } });
    select.open();
    (select as any)._cancelOpenSelectedScroll();
    const orderAtOpen = [...(select as any)._renderPlan.filteredKeys];

    await select.setSelectedValues(['d']);
    expect((select as any)._renderPlan.filteredKeys).toEqual(orderAtOpen);

    const scroll = vi.spyOn(select as any, '_scrollOptionWithinOptionsContainer');
    (select as any)._scrollToSelected({ setActive: false });

    expect(scroll).toHaveBeenCalledTimes(1);
    const scrollTarget = scroll.mock.calls[0]?.[0];
    expect(scrollTarget).toBeInstanceOf(HTMLElement);
    if (!(scrollTarget instanceof HTMLElement)) throw new Error('Expected an HTMLElement scroll target');
    expect(scrollTarget.getAttribute('data-index')).toBe('3');
    expect((select as any)._engine.state.selectedKeys).toEqual(new Set(['d']));
  });
});
