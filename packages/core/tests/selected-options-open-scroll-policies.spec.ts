import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) customElements.define('enhanced-select', EnhancedSelect);

type Block = 'start' | 'center' | 'end' | 'nearest';

function rect(top: number, bottom: number): DOMRect {
  return {
    x: 0, y: top, top, bottom, left: 0, right: 100, width: 100,
    height: bottom - top, toJSON: () => ({}),
  } as DOMRect;
}

describe('selected-option open scroll policies (E3.3)', () => {
  let select: EnhancedSelect;
  let scroller: HTMLElement;

  beforeEach(async () => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.updateConfig({
      virtualize: false,
      selection: { mode: 'multi' },
      scrollToSelected: { enabled: true, onOpen: 'align', behavior: 'instant', block: 'start' },
    });
    document.body.append(select);
    select.setItems([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ]);
    await select.setSelectedValues(['b']);
    select.open();
    scroller = select.shadowRoot!.querySelector<HTMLElement>('.options-container')!;
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 100 });
    Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 600 });
    scroller.getBoundingClientRect = () => rect(100, 200);
    scroller.scrollTop = 50;
  });

  afterEach(() => {
    select.remove();
    vi.restoreAllMocks();
  });

  it.each([
    ['start', 60],
    ['center', 20],
    ['end', 0],
  ] as const)('align with block=%s even when the target is visible', (block, expectedTop) => {
    const option = select.shadowRoot!.querySelector<HTMLElement>('[data-value="b"]')!;
    option.getBoundingClientRect = () => rect(110, 130);
    const scrollToCalls: ScrollToOptions[] = [];
    const scrollTo: {
      (options?: ScrollToOptions): void;
      (x: number, y: number): void;
    } = (optionsOrX?: ScrollToOptions | number, y?: number): void => {
      if (typeof optionsOrX === 'object') {
        const options = optionsOrX ?? {};
        scrollToCalls.push(options);
        scroller.scrollTop = Number(options.top ?? scroller.scrollTop);
      } else if (typeof optionsOrX === 'number') {
        scrollToCalls.push({ left: optionsOrX, top: y });
      }
    };
    scroller.scrollTo = scrollTo;

    (select as any)._scrollOptionWithinOptionsContainer(option, block, 'instant', false);

    expect(scrollToCalls).toHaveLength(1);
    expect(scrollToCalls[0]).toMatchObject({ top: expectedTop, behavior: 'instant' });
  });

  it('reveal does not move a fully visible target and reveals an offscreen target only as needed', () => {
    const option = select.shadowRoot!.querySelector<HTMLElement>('[data-value="b"]')!;
    const scrollToCalls: ScrollToOptions[] = [];
    const scrollTo: {
      (options?: ScrollToOptions): void;
      (x: number, y: number): void;
    } = (optionsOrX?: ScrollToOptions | number, y?: number): void => {
      if (typeof optionsOrX === 'object') {
        const options = optionsOrX ?? {};
        scrollToCalls.push(options);
        scroller.scrollTop = Number(options.top ?? scroller.scrollTop);
      } else if (typeof optionsOrX === 'number') {
        scrollToCalls.push({ left: optionsOrX, top: y });
      }
    };
    scroller.scrollTo = scrollTo;

    option.getBoundingClientRect = () => rect(110, 130);
    (select as any)._scrollOptionWithinOptionsContainer(option, 'nearest', 'instant', true);
    expect(scrollToCalls).toHaveLength(0);

    option.getBoundingClientRect = () => rect(250, 270);
    (select as any)._scrollOptionWithinOptionsContainer(option, 'nearest', 'instant', true);
    expect(scrollToCalls).toHaveLength(1);
    expect(scrollToCalls[0]).toMatchObject({ top: 120, behavior: 'instant' });
  });

  it('preserve keeps the same-order viewport and restores a stable option after selected-first reorders it', async () => {
    select.updateConfig({ scrollToSelected: { onOpen: 'preserve' } });
    scroller.scrollTop = 40;
    const before = select.shadowRoot!.querySelector<HTMLElement>('[data-value="b"]')!;
    before.getBoundingClientRect = () => rect(120, 140);
    select.close();
    expect((select as any)._closedOptionsViewportAnchor).toMatchObject({ key: 'b', offset: 20, scrollTop: 40 });

    await select.setSelectedValues(['c']);
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    select.open();
    scroller.scrollTop = 40;
    const after = select.shadowRoot!.querySelector<HTMLElement>('[data-value="b"]')!;
    after.getBoundingClientRect = () => rect(180, 200);
    const activeBefore = (select as any)._engine.state.activeKey;
    const selectedBefore = new Set((select as any)._engine.state.selectedKeys);

    (select as any)._restorePreservedOptionsViewport();

    expect(scroller.scrollTop).toBe(100);
    expect((select as any)._engine.state.activeKey).toBe(activeBefore);
    expect((select as any)._engine.state.selectedKeys).toEqual(selectedBefore);
  });

  it('does not restore an anchor when displayed ordering is unchanged', () => {
    select.updateConfig({ scrollToSelected: { onOpen: 'preserve' } });
    scroller.scrollTop = 40;
    const option = select.shadowRoot!.querySelector<HTMLElement>('[data-value="b"]')!;
    option.getBoundingClientRect = () => rect(120, 140);
    select.close();
    select.open();
    scroller.scrollTop = 70;

    (select as any)._restorePreservedOptionsViewport();

    expect(scroller.scrollTop).toBe(70);
  });

  it('snapshots onOpen per opening and immediately cancels when automatic scrolling is disabled', () => {
    select.close();
    select.updateConfig({ scrollToSelected: { onOpen: 'preserve' } });
    select.open();
    expect((select as any)._scrollToSelectedConfigAtOpen.onOpen).toBe('preserve');
    const generation = (select as any)._openSelectedScrollGeneration;
    select.updateConfig({ scrollToSelected: { onOpen: 'align' } });
    expect((select as any)._scrollToSelectedConfigAtOpen.onOpen).toBe('preserve');
    expect((select as any)._openSelectedScrollGeneration).toBe(generation);

    select.updateConfig({ scrollToSelected: { enabled: false } });
    expect((select as any)._openSelectedScrollGeneration).toBeGreaterThan(generation);
    expect((select as any)._openOptionsViewportAnchor).toBeNull();
  });
});
