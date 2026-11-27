import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { resetSelectConfig } from '../src/config/global-config.js';

if (!customElements.get('enhanced-select')) customElements.define('enhanced-select', EnhancedSelect);

describe('horizontal multi-select latest-chip scroll (#100)', () => {
  let select: EnhancedSelect;
  let frames: Array<FrameRequestCallback>;
  let scrollBy: ReturnType<typeof vi.fn>;
  let restoreRaf: () => void;

  beforeEach(() => {
    resetSelectConfig();
    frames = [];
    const oldRaf = globalThis.requestAnimationFrame;
    const oldCancel = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    }) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = vi.fn() as typeof cancelAnimationFrame;
    restoreRaf = () => {
      globalThis.requestAnimationFrame = oldRaf;
      globalThis.cancelAnimationFrame = oldCancel;
    };
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.updateConfig({
      selection: { mode: 'multi' },
      multiSelectDisplay: {
        mode: 'horizontal', overflowX: 'auto', scrollToLatestChip: true,
        scrollToLatestChipBehavior: 'smooth',
      },
    });
    document.body.appendChild(select);
    select.setItems(Array.from({ length: 5 }, (_, i) => ({
      value: String(i), label: `Selection ${i}`,
    })));
    const viewport = (select as any)._inputContent as HTMLElement;
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 120 });
    Object.defineProperty(viewport, 'clientLeft', { configurable: true, value: 0 });
    viewport.getBoundingClientRect = () => ({ left: 0, right: 120, width: 120 } as DOMRect);
    const scrollBySpy = vi.fn();
    const scrollByMock: {
      (options?: ScrollToOptions): void;
      (x: number, y: number): void;
    } = (...args: [ScrollToOptions?] | [number, number]): void => {
      scrollBySpy(...args);
    };
    scrollBy = scrollBySpy;
    viewport.scrollBy = scrollByMock;
  });

  afterEach(() => {
    select.remove();
    restoreRaf();
    resetSelectConfig();
    vi.restoreAllMocks();
  });

  function flushFrames() {
    const pending = frames.splice(0);
    pending.forEach((callback) => callback(0));
  }

  function setChipRect(index: number, left: number, right: number) {
    const chips = (select as any)._inputContent.querySelectorAll('.selection-badge') as NodeListOf<HTMLElement>;
    expect(chips[index]).toBeTruthy();
    chips[index].getBoundingClientRect = () => ({ left, right, width: right - left } as DOMRect);
  }

  it('scrolls newly added chips into the horizontal viewport', async () => {
    await select.setSelectedValues(['0', '1']);
    setChipRect(1, 160, 215);
    flushFrames();
    expect(scrollBy).toHaveBeenCalledWith({ left: 95, behavior: 'smooth' });
  });

  it('does not scroll on removal or unchanged selection rerenders and restores scrollLeft', async () => {
    await select.setSelectedValues(['0', '1']);
    flushFrames();
    scrollBy.mockClear();
    const viewport = (select as any)._inputContent as HTMLElement;
    viewport.scrollLeft = 37;
    await select.setSelectedValues(['0']);
    expect(viewport.scrollLeft).toBe(37);
    flushFrames();
    expect(scrollBy).not.toHaveBeenCalled();
    select.setItems(Array.from({ length: 5 }, (_, i) => ({ value: String(i), label: `Item ${i}` })));
    flushFrames();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('remains opt-in and does nothing in wrap mode', async () => {
    select.updateConfig({ multiSelectDisplay: { mode: 'horizontal', scrollToLatestChip: false } });
    await select.setSelectedValues(['0', '1']);
    setChipRect(1, 160, 215);
    flushFrames();
    expect(scrollBy).not.toHaveBeenCalled();
    select.updateConfig({ multiSelectDisplay: { scrollToLatestChip: true, mode: 'wrap' } });
    await select.setSelectedValues(['0', '1', '2']);
    flushFrames();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('cancels stale scroll intentions when selection changes again or the component disconnects', async () => {
    await select.setSelectedValues(['0', '1']);
    const pending = frames.slice();
    await select.setSelectedValues(['0']);
    pending.forEach((callback) => callback(0));
    flushFrames();
    expect(scrollBy).not.toHaveBeenCalled();

    await select.setSelectedValues(['0', '1']);
    const newPending = frames.splice(0);
    select.remove();
    newPending.forEach((callback) => callback(0));
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('respects reduced-motion preferences', async () => {
    const oldMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    try {
      await select.setSelectedValues(['0', '1']);
      setChipRect(1, 160, 215);
      flushFrames();
      expect(scrollBy).toHaveBeenCalledWith({ left: 95, behavior: 'auto' });
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: oldMatchMedia });
    }
  });
});
