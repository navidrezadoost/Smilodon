import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

function makeSelect(): EnhancedSelect {
  const select = document.createElement('enhanced-select') as EnhancedSelect;
  document.body.appendChild(select);
  select.setItems([
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
    { value: 'three', label: 'Three' },
  ]);
  return select;
}

function setScrollerGeometry(select: EnhancedSelect) {
  const scroller = select.shadowRoot!.querySelector<HTMLElement>('.options-container')!;
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 100 });
  Object.defineProperty(scroller, 'clientTop', { configurable: true, value: 0 });
  Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 400 });
  scroller.scrollTop = 20;
  vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, top: 0, right: 100, bottom: 100, left: 0, width: 100, height: 100,
    toJSON: () => ({}),
  } as DOMRect);
  const scrollTo = vi.fn(({ top }: ScrollToOptions) => {
    if (typeof top === 'number') scroller.scrollTop = top;
  });
  Object.defineProperty(scroller, 'scrollTo', { configurable: true, value: scrollTo });
  return { scroller, scrollTo };
}

function setOptionGeometry(select: EnhancedSelect, optionTop = 150) {
  const option = select.shadowRoot!.querySelector<HTMLElement>('[data-index="0"]')!;
  vi.spyOn(option, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: optionTop, top: optionTop, right: 100, bottom: optionTop + 20,
    left: 0, width: 100, height: 20, toJSON: () => ({}),
  } as DOMRect);
  const scrollIntoView = vi.fn();
  Object.defineProperty(option, 'scrollIntoView', { configurable: true, value: scrollIntoView });
  return { option, scrollIntoView };
}

async function nextFrames(count = 3): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

describe('selected-option scroll coordination on dropdown open', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = makeSelect();
  });

  afterEach(() => {
    select.remove();
    vi.restoreAllMocks();
  });

  it('keeps active and ARIA state immediate, then scrolls an off-screen option once in the options viewport', async () => {
    await select.setSelectedValues(['one']);
    const { scroller, scrollTo } = setScrollerGeometry(select);
    Object.defineProperty(select.shadowRoot!.querySelector('.select-dropdown'), 'getAnimations', {
      configurable: true,
      value: () => [],
    });
    select.updateConfig({ scrollToSelected: { enabled: true, multiSelectTarget: 'first', behavior: 'auto', block: 'center' } });

    select.open();

    const { option, scrollIntoView } = setOptionGeometry(select);
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    expect(input.getAttribute('aria-activedescendant')).toBe(option.id);
    expect(scrollIntoView).not.toHaveBeenCalled();
    await nextFrames();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 130, behavior: 'auto' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not move a selected option that is already fully visible', async () => {
    await select.setSelectedValues(['one']);
    const { scroller, scrollTo } = setScrollerGeometry(select);
    Object.defineProperty(select.shadowRoot!.querySelector('.select-dropdown'), 'getAnimations', {
      configurable: true,
      value: () => [],
    });
    select.updateConfig({ scrollToSelected: { enabled: true, multiSelectTarget: 'first' } });

    select.open();
    setOptionGeometry(select, 30);
    await nextFrames();

    expect(scroller.scrollTop).toBe(20);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('waits for the dropdown entrance animation and cancels stale restoration after keyboard navigation', async () => {
    await select.setSelectedValues(['one']);
    const { scrollTo } = setScrollerGeometry(select);
    const dropdown = select.shadowRoot!.querySelector<HTMLElement>('.select-dropdown')!;
    const animationTarget = new EventTarget() as EventTarget & {
      effect: AnimationEffect;
      playState: AnimationPlayState;
      currentTime: number;
    };
    animationTarget.effect = { getComputedTiming: () => ({ iterations: 1, endTime: 500 }) } as AnimationEffect;
    animationTarget.playState = 'running';
    animationTarget.currentTime = 0;
    Object.defineProperty(dropdown, 'getAnimations', {
      configurable: true,
      value: () => [animationTarget as unknown as Animation],
    });
    select.updateConfig({ scrollToSelected: { enabled: true, multiSelectTarget: 'first' } });

    select.open();
    setOptionGeometry(select);
    await nextFrames();
    expect(scrollTo).not.toHaveBeenCalled();

    select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    animationTarget.playState = 'finished';
    animationTarget.dispatchEvent(new Event('finish'));
    await nextFrames();

    expect(scrollTo).not.toHaveBeenCalled();
    expect(select.getSelectedValues()).toEqual(['one']);
    expect(select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!
      .getAttribute('aria-activedescendant')).toBe(select.shadowRoot!.querySelector('[data-index="1"]')?.id);
  });

  it('performs no automatic open scroll when scrollToSelected is disabled', async () => {
    await select.setSelectedValues(['one']);
    const { scrollTo } = setScrollerGeometry(select);
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    select.updateConfig({ scrollToSelected: { enabled: false, multiSelectTarget: 'first' } });

    select.open();
    await nextFrames();

    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
