import { test, expect, Locator } from '@playwright/test';

/**
 * Basic Selection E2E Test
 * 
 * Tests the fundamental selection behavior using vanilla demo
 * 
 * @all - Core functionality test
 * @critical - Critical path test
 */

// Helper to open dropdown by focusing input in shadow DOM
async function openDropdown(select: Locator) {
  await select.evaluate((el: any) => {
    const shadow = el.shadowRoot;
    const input = shadow?.querySelector('input');
    input?.focus();
  });
  await select.page().waitForTimeout(100);
}

async function startKeyboardDiagnostics(select: Locator) {
  await select.evaluate((el: any) => {
    const root = el.shadowRoot as ShadowRoot;
    const input = root.querySelector('input') as HTMLInputElement;
    const readState = (phase: string, key: string | null, defaultPrevented: boolean | null) => {
      const activeIndex = el._state?.activeIndex ?? -1;
      const activeKey = el._engine?.state?.activeKey ?? null;
      const activeDescendant = input.getAttribute('aria-activedescendant');
      const activeTarget = activeDescendant ? root.getElementById(activeDescendant) : null;
      const activeTargetIndex = activeTarget ? Number(activeTarget.getAttribute('data-index')) : null;
      const options = Array.from(root.querySelectorAll<HTMLElement>('select-option'));
      const selected = Array.from(el._state?.selectedItems?.values?.() ?? [], (item: any) => ({
        label: item?.label ?? null,
        value: item?.value ?? null,
      }));
      const listbox = root.querySelector('[role="listbox"]') as HTMLElement | null;
      return {
        phase,
        key,
        defaultPrevented,
        focusedDocumentElement: document.activeElement?.tagName ?? null,
        focusedShadowElement: root.activeElement?.tagName ?? null,
        inputFocused: root.activeElement === input,
        popupOpen: Boolean(el._state?.isOpen),
        popupDisplay: listbox ? getComputedStyle(listbox).display : null,
        activeIndex,
        activeKey: activeKey === null ? null : String(activeKey),
        ariaActiveDescendant: activeDescendant,
        activeTargetIndex: Number.isFinite(activeTargetIndex) ? activeTargetIndex : null,
        activeTargetValue: activeTarget?.getAttribute('data-value') ?? null,
        activeTargetLabel: activeTarget?.shadowRoot?.querySelector('.option-content')?.textContent?.trim() ?? null,
        activeTargetMarked: Boolean(activeTarget?.classList.contains('smilodon-option--active')),
        activeStateMatchesRenderedDom: activeIndex < 0
          ? activeDescendant === null
          : activeTargetIndex === activeIndex && Boolean(activeTarget?.classList.contains('smilodon-option--active')),
        renderedOptionIndexes: options.map((option) => Number(option.getAttribute('data-index'))),
        selected,
        renderCycleId: el._renderCycleId ?? null,
        pendingLifecycleRafs: el._lifecycleRafs?.size ?? null,
        time: performance.now(),
      };
    };

    const events: ReturnType<typeof readState>[] = [];
    input.addEventListener('keydown', (event) => {
      events.push(readState('keydown-after-component-handler', event.key, event.defaultPrevented));
    });
    input.addEventListener('keyup', (event) => {
      events.push(readState('keyup', event.key, event.defaultPrevented));
    });
    el.__keyboardNavigationDiagnostics = {
      before: readState('before-key-sequence', null, null),
      events,
      readFinal: () => readState('after-key-sequence', null, null),
    };
  });
}

async function attachKeyboardDiagnostics(select: Locator) {
  const diagnostics = await select.evaluate((el: any) => ({
    before: el.__keyboardNavigationDiagnostics.before,
    events: el.__keyboardNavigationDiagnostics.events,
    after: el.__keyboardNavigationDiagnostics.readFinal(),
  }));
  await test.info().attach('keyboard-navigation-sequence.json', {
    body: JSON.stringify(diagnostics, null, 2),
    contentType: 'application/json',
  });
  console.info('[keyboard-navigation-sequence]', JSON.stringify(diagnostics));
}

async function holdLifecycleAnimationFrames(select: Locator) {
  await select.evaluate((el: any) => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let nextFrameId = 0;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      const id = ++nextFrameId;
      callbacks.set(id, callback);
      return id;
    }) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = ((id: number) => {
      callbacks.delete(id);
    }) as typeof window.cancelAnimationFrame;
    el.__flushLifecycleAnimationFrames = () => {
      let frameCount = 0;
      while (callbacks.size > 0 && frameCount < 10) {
        const frameCallbacks = Array.from(callbacks.values());
        callbacks.clear();
        frameCallbacks.forEach((callback) => callback(performance.now()));
        frameCount += 1;
      }
      return { frameCount, pendingCallbacks: callbacks.size };
    };
  });
}

test.describe('Basic Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');
  });
  
  test('@all @critical should render select component', async ({ page }) => {
    const select = page.locator('enhanced-select').first();
    await expect(select).toBeVisible();
  });
  
  test('@all @critical should open dropdown on click', async ({ page }) => {
    const select = page.locator('enhanced-select').first();
    
    // Focus the input to open dropdown
    await openDropdown(select);
    
    // Check if dropdown is visible
    const isVisible = await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const dropdown = shadow?.querySelector('[role="listbox"]') as HTMLElement;
      return dropdown && window.getComputedStyle(dropdown).display !== 'none';
    });
    
    expect(isVisible).toBe(true);
  });
  
  test('@all @critical should select item on click', async ({ page }) => {
    const select = page.locator('enhanced-select').first();
    
    // Open dropdown
    await openDropdown(select);
    
    // Click the second option (Banana - index 1) by clicking its container
    const clicked = await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const options = shadow?.querySelectorAll('select-option');
      if (options && options.length > 1) {
        const optionShadow = options[1].shadowRoot;
        const container = optionShadow?.querySelector('.option-container');
        if (container) {
          (container as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    
    expect(clicked).toBe(true);
    
    // Verify selection by checking the selected value
    const selectedValue = await select.evaluate((el: any) => {
      return el._state?.selectedItems?.values().next().value?.value;
    });
    
    expect(selectedValue).toBe('banana');
  });
  
  test('@all should close dropdown after selection', async ({ page }) => {
    const select = page.locator('enhanced-select').first();
    
    // Open and select
    await openDropdown(select);
    
    await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const option = shadow?.querySelector('select-option');
      const optionShadow = option?.shadowRoot;
      const container = optionShadow?.querySelector('.option-container');
      (container as HTMLElement)?.click();
    });
    
    await page.waitForTimeout(100);
    
    // Verify dropdown closed
    const isHidden = await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const dropdown = shadow?.querySelector('[role="listbox"]') as HTMLElement;
      return dropdown && window.getComputedStyle(dropdown).display === 'none';
    });
    
    expect(isHidden).toBe(true);
  });
  
  test('@all should emit change event on selection', async ({ page }) => {
    // Set up event listener
    await page.evaluate(() => {
      (window as any).selectionEvents = [];
      document.querySelector('enhanced-select')?.addEventListener('change', (e: any) => {
        (window as any).selectionEvents.push(e.detail);
      });
    });
    
    const select = page.locator('enhanced-select').first();
    await openDropdown(select);
    
    // Click third option (Cherry - index 2) by clicking its container
    await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const options = shadow?.querySelectorAll('select-option');
      if (options && options.length > 2) {
        const optionShadow = options[2].shadowRoot;
        const container = optionShadow?.querySelector('.option-container');
        (container as HTMLElement)?.click();
      }
    });
    
    await page.waitForTimeout(100);
    
    // Verify event was fired
    const events = await page.evaluate(() => (window as any).selectionEvents);
    expect(events).toHaveLength(1);
    expect(events[0].selectedValues).toContain('cherry');
  });

  test('@all should emit the option select event before the aggregate change event', async ({ page }) => {
    const select = page.locator('enhanced-select').first();
    await select.evaluate((element: any) => {
      element.__selectionEventTrace = [];
      element.addEventListener('select', (event: CustomEvent) => {
        element.__selectionEventTrace.push({
          type: 'select',
          index: event.detail.index,
          value: event.detail.value,
          label: event.detail.label,
          selected: event.detail.selected,
          multi: event.detail.multi,
        });
      });
      element.addEventListener('change', (event: CustomEvent) => {
        element.__selectionEventTrace.push({
          type: 'change',
          selectedValues: event.detail.selectedValues,
        });
      });
    });

    await openDropdown(select);
    await select.evaluate((element: any) => {
      const option = element.shadowRoot?.querySelector('[part="option"][data-index="0"]') as HTMLElement | null;
      option?.click();
    });

    await expect.poll(() => select.evaluate((element: any) => element.__selectionEventTrace.length)).toBe(2);
    const trace = await select.evaluate((element: any) => element.__selectionEventTrace);
    expect(trace[0]).toMatchObject({
      type: 'select',
      index: 0,
      value: 'apple',
      label: 'Apple',
      selected: true,
      multi: false,
    });
    expect(trace[1]).toMatchObject({ type: 'change', selectedValues: ['apple'] });
  });
  
  test('@all @critical should navigate with keyboard', async ({ page }) => {
    const select = page.locator('enhanced-select').first();
    const input = select.locator('input');

    // Focusing the combobox opens it and marks the first option active.
    await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const input = shadow?.querySelector('input');
      input?.focus();
    });
    await expect.poll(() => select.evaluate((el: any) => el._state?.isOpen)).toBe(true);
    await expect.poll(() => select.evaluate((el: any) => el._state?.activeIndex)).toBe(0);
    await startKeyboardDiagnostics(select);

    await input.press('ArrowDown');
    await expect.poll(() => select.evaluate((el: any) => el._state?.activeIndex)).toBe(1);
    await input.press('ArrowDown');
    await expect.poll(() => select.evaluate((el: any) => el._state?.activeIndex)).toBe(2);
    await input.press('Enter');
    await attachKeyboardDiagnostics(select);
    await expect.poll(() => select.evaluate((el: any) => el._state?.selectedItems?.values().next().value?.label))
      .toBe('Cherry');

    const selectedValue = await select.evaluate((el: any) => el._state?.selectedItems?.values().next().value?.label);
    expect(selectedValue).toBe('Cherry');
  });

  test('@critical keeps the active option stable when deferred selected-item scrolling completes', async ({ page }) => {
    const select = page.locator('enhanced-select').first();
    const input = select.locator('input');

    await input.focus();
    await expect.poll(() => select.evaluate((el: any) => el._state?.isOpen)).toBe(true);
    await expect.poll(() => select.evaluate((el: any) => el._state?.activeIndex)).toBe(0);
    await expect.poll(() => select.evaluate((el: any) => el._lifecycleRafs.size)).toBe(0);
    await startKeyboardDiagnostics(select);

    // Establish a selected item, then close and reopen with ArrowDown. Reopening
    // queues the component's double-RAF scroll-to-selection work.
    await input.press('Enter');
    await expect.poll(() => select.evaluate((el: any) => ({
      open: el._state?.isOpen,
      selected: el._state?.selectedItems?.values().next().value?.label ?? null,
    }))).toEqual({ open: false, selected: 'Apple' });

    // Hold only lifecycle RAFs so keyboard navigation can occur before the
    // deferred scroll callback. Then flush it to verify it cannot override the
    // newer keyboard intent.
    await holdLifecycleAnimationFrames(select);
    await input.press('ArrowDown');
    await expect(select).toHaveAttribute('data-open', 'true');
    await input.press('ArrowDown');
    const afterKeyboardMove = await select.evaluate((el: any) => ({
      activeIndex: el._state?.activeIndex,
      activeKey: el._engine?.state?.activeKey,
      ariaActiveDescendant: el._input.getAttribute('aria-activedescendant'),
    }));
    const flushedFrames = await select.evaluate((el: any) => el.__flushLifecycleAnimationFrames());
    const afterDeferredScroll = await select.evaluate((el: any) => ({
      activeIndex: el._state?.activeIndex,
      activeKey: el._engine?.state?.activeKey,
      ariaActiveDescendant: el._input.getAttribute('aria-activedescendant'),
    }));
    await attachKeyboardDiagnostics(select);

    expect(afterKeyboardMove.activeIndex).toBe(1);
    expect(flushedFrames.pendingCallbacks).toBe(0);
    expect(flushedFrames.frameCount).toBeGreaterThan(0);
    expect(afterDeferredScroll).toEqual(afterKeyboardMove);

    await input.press('ArrowDown');
    await expect.poll(() => select.evaluate((el: any) => el._state?.activeIndex)).toBe(2);
    await input.press('Enter');
    await expect.poll(() => select.evaluate((el: any) => el._state?.selectedItems?.values().next().value?.label))
      .toBe('Cherry');
  });
  
  test('@all should close dropdown with Escape', async ({ page }) => {
    const select = page.locator('enhanced-select').first();
    
    // Open dropdown
    await openDropdown(select);
    
    // Verify it's open
    let isOpen = await select.evaluate((el: any) => el._state?.isOpen);
    expect(isOpen).toBe(true);
    
    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    
    // Verify closed
    isOpen = await select.evaluate((el: any) => el._state?.isOpen);
    expect(isOpen).toBe(false);
  });
});
