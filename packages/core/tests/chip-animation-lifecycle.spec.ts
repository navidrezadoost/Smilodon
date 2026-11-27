import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type TestAnimation = Animation & { animationName: string };

function makeAnimation(endTime = 300) {
  let finish!: () => void;
  const finished = new Promise<void>((resolve) => { finish = resolve; });
  const animation = {
    animationName: 'consumerChipExit',
    playState: 'running',
    effect: { getComputedTiming: () => ({ endTime }) },
    finished,
    cancel: vi.fn(),
  } as unknown as TestAnimation;
  return { animation, finish };
}

describe('multi-select chip presentation lifecycle', () => {
  const selects: EnhancedSelect[] = [];

  afterEach(() => {
    selects.splice(0).forEach((select) => select.remove());
  });

  async function createSelect(values = ['a', 'b']): Promise<EnhancedSelect> {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    selects.push(select);
    select.updateConfig({
      selection: { mode: 'multi', showRemoveButton: true },
      multiSelectDisplay: { mode: 'horizontal', overflowX: 'auto', scrollToLatestChip: false },
    });
    select.setItems([
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ]);
    document.body.appendChild(select);
    await select.setSelectedValues(values);
    return select;
  }

  function chips(select: EnhancedSelect): HTMLElement[] {
    return Array.from((select as any)._inputContent.querySelectorAll('.selection-badge'));
  }

  it('reuses unchanged chip nodes and updates metadata in place', async () => {
    const select = await createSelect();
    const [alpha, beta] = chips(select);

    select.updateConfig({ placeholder: 'unrelated update' });
    expect(chips(select)).toEqual([alpha, beta]);

    select.setItems([
      { value: 'a', label: 'Alpha revised' },
      { value: 'b', label: 'Beta revised' },
      { value: 'c', label: 'Gamma' },
    ]);
    expect(chips(select)).toEqual([alpha, beta]);
    expect(alpha.querySelector('.selection-badge-label')?.textContent).toBe('Alpha revised');
    expect(beta.querySelector('[part="chip-remove"]')?.getAttribute('aria-label')).toBe('Remove Beta revised');
  });

  it('removes synchronously when exit motion is disabled and emits one change', async () => {
    const select = await createSelect();
    const changes = vi.fn();
    select.addEventListener('change', changes);
    const [alpha] = chips(select);

    (alpha.querySelector('[part="chip-remove"]') as HTMLButtonElement).click();

    expect(select.getSelectedValues()).toEqual(['b']);
    expect(alpha.isConnected).toBe(false);
    expect(chips(select)).toHaveLength(1);
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('retains an inaccessible exit node until all its animations finish', async () => {
    const select = await createSelect();
    const [alpha, beta] = chips(select);
    const exit = makeAnimation();
    Object.defineProperty(alpha, 'getAnimations', { value: () => [exit.animation] });
    (alpha.querySelector('[part="chip-remove"]') as HTMLButtonElement).click();

    expect(select.getSelectedValues()).toEqual(['b']);
    expect(alpha.isConnected).toBe(true);
    expect(alpha.dataset.motion).toBe('exiting');
    expect(alpha.getAttribute('aria-hidden')).toBe('true');
    expect(alpha.hasAttribute('inert')).toBe(true);
    expect(alpha.getAttribute('part')).toBe('chip-exiting');
    expect((alpha.querySelector('[part="chip-remove"]') as HTMLButtonElement).disabled).toBe(true);

    select.updateConfig({ placeholder: 'refresh while exiting' });
    expect(chips(select)).toEqual([alpha, beta]);
    expect(chips(select).filter((chip) => chip.dataset.motion === 'exiting')).toEqual([alpha]);

    exit.finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(alpha.isConnected).toBe(false);
    expect(chips(select)).toEqual([beta]);
  });

  it('cancels a pending exit when the same key is selected again', async () => {
    const select = await createSelect();
    const [alpha] = chips(select);
    const exit = makeAnimation();
    Object.defineProperty(alpha, 'getAnimations', { value: () => [exit.animation] });
    await select.setSelectedValues(['b']);
    expect(alpha.dataset.motion).toBe('exiting');

    await select.setSelectedValues(['a', 'b']);

    expect(select.getSelectedValues()).toEqual(['a', 'b']);
    expect(chips(select).filter((chip) => chip === alpha)).toHaveLength(1);
    expect(alpha.isConnected).toBe(true);
    expect(alpha.hasAttribute('inert')).toBe(false);
    expect(alpha.hasAttribute('aria-hidden')).toBe(false);
    expect(alpha.getAttribute('part')).toBe('chip');
    expect(exit.animation.cancel).toHaveBeenCalledTimes(1);
  });

  it('finishes independent exits independently and clears pending exits on disconnect', async () => {
    const select = await createSelect();
    const [alpha, beta] = chips(select);
    const alphaExit = makeAnimation(100);
    const betaExit = makeAnimation(800);
    Object.defineProperty(alpha, 'getAnimations', { value: () => [alphaExit.animation] });
    Object.defineProperty(beta, 'getAnimations', { value: () => [betaExit.animation] });
    await select.setSelectedValues([]);
    expect(select.getSelectedValues()).toEqual([]);
    expect(alpha.isConnected).toBe(true);
    expect(beta.isConnected).toBe(true);

    alphaExit.finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(alpha.isConnected).toBe(false);
    expect(beta.isConnected).toBe(true);

    select.remove();
    expect(beta.isConnected).toBe(false);
    expect(betaExit.animation.cancel).toHaveBeenCalledTimes(1);
    expect((select as any)._chipExitStates.size).toBe(0);
  });

  it('uses a bounded fallback for animations that never finish', async () => {
    const select = await createSelect(['a']);
    const [alpha] = chips(select);
    vi.useFakeTimers();
    try {
      const neverFinishes = makeAnimation(Number.POSITIVE_INFINITY);
      Object.defineProperty(alpha, 'getAnimations', { value: () => [neverFinishes.animation] });
      await select.setSelectedValues([]);
      expect(alpha.isConnected).toBe(true);

      await vi.advanceTimersByTimeAsync(1000);
      expect(alpha.isConnected).toBe(false);
      expect(neverFinishes.animation.cancel).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears pending visual exits immediately when selection mode changes', async () => {
    const select = await createSelect();
    const [alpha, beta] = chips(select);
    const exit = makeAnimation();
    Object.defineProperty(alpha, 'getAnimations', { value: () => [exit.animation] });
    await select.setSelectedValues(['b']);
    expect(alpha.isConnected).toBe(true);

    select.updateConfig({ selection: { mode: 'single' } });

    expect(alpha.isConnected).toBe(false);
    expect(beta.isConnected).toBe(false);
    expect((select as any)._chipExitStates.size).toBe(0);
    expect(exit.animation.cancel).toHaveBeenCalledTimes(1);
  });

  it('moves focus out of an exiting chip and never focuses an inert remove control', async () => {
    const select = await createSelect();
    const [alpha, beta] = chips(select);
    const exit = makeAnimation();
    Object.defineProperty(alpha, 'getAnimations', { value: () => [exit.animation] });
    const alphaRemove = alpha.querySelector<HTMLButtonElement>('[part="chip-remove"]')!;
    alphaRemove.focus();

    await select.setSelectedValues(['b']);

    expect(alpha.hasAttribute('inert')).toBe(true);
    expect((select as any)._shadow.activeElement).not.toBe(alphaRemove);
    expect((select as any)._shadow.activeElement).toBe(beta.querySelector('[part="chip-remove"]'));
  });
});
