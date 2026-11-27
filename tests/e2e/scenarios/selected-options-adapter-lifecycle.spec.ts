import { expect, test } from '@playwright/test';

const fixtureUrl = 'http://localhost:5178/adapter-config-qualification.html';
const frameworks = ['react', 'react-native-web', 'vue', 'svelte', 'solid', 'vanilla', 'web-component'];

async function instrumentScroll(select: import('@playwright/test').Locator): Promise<void> {
  await select.evaluate((element: any) => {
    const port = element._optionsContainer as HTMLElement;
    const metrics = { scrollTo: 0, scrollTopChanges: 0, scrollIntoView: 0 };
    const scrollTo = port.scrollTo.bind(port);
    port.scrollTo = ((...args: Parameters<HTMLElement['scrollTo']>) => {
      metrics.scrollTo += 1;
      return scrollTo(...args);
    }) as HTMLElement['scrollTo'];

    let prototype: object | null = port;
    let scrollTopDescriptor: PropertyDescriptor | undefined;
    while (prototype && !scrollTopDescriptor) {
      scrollTopDescriptor = Object.getOwnPropertyDescriptor(prototype, 'scrollTop');
      prototype = Object.getPrototypeOf(prototype);
    }
    if (!scrollTopDescriptor?.get || !scrollTopDescriptor.set) throw new Error('scrollTop accessor unavailable');
    Object.defineProperty(port, 'scrollTop', {
      configurable: true,
      get: () => scrollTopDescriptor!.get!.call(port),
      set: (value: number) => {
        const before = scrollTopDescriptor!.get!.call(port);
        scrollTopDescriptor!.set!.call(port, value);
        if (Math.abs(scrollTopDescriptor!.get!.call(port) - before) > 0.5) metrics.scrollTopChanges += 1;
      },
    });

    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...args: Parameters<Element['scrollIntoView']>) {
      if (element.shadowRoot.contains(this)) metrics.scrollIntoView += 1;
      return originalScrollIntoView.apply(this, args);
    };
    element.__e34ScrollMetrics = metrics;
    element.__e34RestoreScrollIntoView = () => { Element.prototype.scrollIntoView = originalScrollIntoView; };
  });
}

test('adapter partial updates preserve open snapshots and scroll siblings', async ({ page }) => {
  await page.goto(fixtureUrl);
  await expect.poll(() => page.evaluate(() => (window as any).__selectedOptionsFixtureReady)).toBe(true);

  for (const framework of frameworks) {
    const section = page.locator(`section[data-framework="${framework}"]`);
    const select = section.locator('enhanced-select');
    await expect(select).toHaveCount(1);
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues())).toEqual(['3']);
    await select.evaluate((element: any) => element.open());
    await expect.poll(() => select.evaluate((element: any) => [...(element.shadowRoot as ShadowRoot)
      .querySelectorAll<HTMLElement>('[part="option"][data-value]')]
      .map((option) => option.dataset.value)))
      .toEqual(['3', '1', '2', '4', '5']);

    await page.evaluate((name) => {
      const updates = (window as any).__selectedOptionsAdapterUpdates as Map<string, (config: unknown) => void>;
      updates.get(name)?.({ selectedOptions: { placement: 'original' } });
    }, framework);

    await expect.poll(() => select.evaluate((element: any) => element._config.selectedOptions.placement))
      .toBe('original');
    await expect.poll(() => select.evaluate((element: any) => element._config.scrollToSelected))
      .toMatchObject({ enabled: false, multiSelectTarget: 'last', onOpen: 'preserve', behavior: 'auto', block: 'center' });
    await expect.poll(() => select.evaluate((element: any) => [...(element.shadowRoot as ShadowRoot)
      .querySelectorAll<HTMLElement>('[part="option"][data-value]')]
      .map((option) => option.dataset.value)))
      .toEqual(['3', '1', '2', '4', '5']);

    await select.evaluate((element: any) => { element.close(); element.open(); });
    await expect.poll(() => select.evaluate((element: any) => [...(element.shadowRoot as ShadowRoot)
      .querySelectorAll<HTMLElement>('[part="option"][data-value]')]
      .map((option) => option.dataset.value)))
      .toEqual(['1', '2', '3', '4', '5']);
    await select.evaluate((element: any) => element.close());
  }
});

test('latest partial config and selection supplied before connection win on first open', async ({ page }) => {
  await page.goto(`${fixtureUrl}?detached=1`);
  await expect.poll(() => page.evaluate(() => (window as any).__selectedOptionsFixtureReady)).toBe(true);

  for (const framework of frameworks) {
    await expect.poll(() => page.evaluate((name) =>
      (window as any).__selectedOptionsAdapterUpdates.has(name)
      && (window as any).__selectedOptionsAdapterSelectionUpdates.has(name), framework)).toBe(true);

    await page.evaluate(async (name) => {
      const updates = (window as any).__selectedOptionsAdapterUpdates as Map<string, (config: unknown) => void>;
      const selections = (window as any).__selectedOptionsAdapterSelectionUpdates as Map<string, (value: string) => void>;
      await updates.get(name)?.({ selectedOptions: { placement: 'selected-first' } });
      await updates.get(name)?.({ selectedOptions: { placement: 'original' } });
      await selections.get(name)?.('5');
      const detached = document.querySelector<HTMLElement>(`section[data-framework="${name}"] enhanced-select`);
      if (detached?.isConnected) throw new Error(`${name} connected before queued updates were applied`);
      const mounts = (window as any).__selectedOptionsAdapterMounts as Map<string, () => void>;
      mounts.get(name)?.();
    }, framework);

    const select = page.locator(`section[data-framework="${framework}"] enhanced-select`);
    await expect(select).toHaveCount(1);
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues())).toEqual(['5']);
    await expect.poll(() => select.evaluate((element: any) => element._config.selectedOptions.placement))
      .toBe('original');
    await expect.poll(() => select.evaluate((element: any) => element._config.scrollToSelected))
      .toMatchObject({ enabled: false, multiSelectTarget: 'last', onOpen: 'preserve', behavior: 'auto', block: 'center' });
    await select.evaluate((element: any) => element.open());
    await expect.poll(() => select.evaluate((element: any) => [...(element.shadowRoot as ShadowRoot)
      .querySelectorAll<HTMLElement>('[part="option"][data-value]')]
      .map((option) => option.dataset.value)))
      .toEqual(['1', '2', '3', '4', '5']);
    await select.evaluate((element: any) => element.close());
  }
});

test('each adapter cancels pending selected scrolling when disposed during entrance animation', async ({ page }) => {
  await page.goto(fixtureUrl);
  await expect.poll(() => page.evaluate(() => (window as any).__selectedOptionsFixtureReady)).toBe(true);

  for (const framework of frameworks) {
    const section = page.locator(`section[data-framework="${framework}"]`);
    const select = section.locator('enhanced-select');
    await expect(select).toHaveCount(1);
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues())).toEqual(['3']);

    await page.evaluate((name) => {
      const updates = (window as any).__selectedOptionsAdapterUpdates as Map<string, (config: unknown) => void>;
      updates.get(name)?.({ scrollToSelected: { enabled: true, onOpen: 'align', block: 'end' } });
    }, framework);
    await expect.poll(() => select.evaluate((element: any) => element._config.scrollToSelected))
      .toMatchObject({ enabled: true, onOpen: 'align', multiSelectTarget: 'last' });

    await select.evaluate((element: any) => {
      element.style.setProperty('--select-dropdown-animation', 'dropdownEnter 600ms linear forwards');
      element.style.setProperty('--select-dropdown-exit-animation', 'none');
      element.style.setProperty('--select-options-max-height', '40px');
    });
    await instrumentScroll(select);
    await select.evaluate((element: any) => element.open());

    await expect.poll(() => select.evaluate((element: any) => element._dropdown.getAnimations()
      .some((animation: Animation) => animation.playState === 'running'))).toBe(true);

    const connectedAfterDispose = await page.evaluate((name) => {
      const element = document.querySelector<HTMLElement>(`section[data-framework="${name}"] enhanced-select`)! as any;
      (window as any).__e34DetachedSelect = element;
      const disposers = (window as any).__selectedOptionsAdapterDisposers as Map<string, () => void>;
      disposers.get(name)?.();
      return element.isConnected;
    }, framework);
    expect(connectedAfterDispose, `${framework} adapter did not disconnect its Core element`).toBe(false);
    const atDispose = await page.evaluate(() => ({ ...(window as any).__e34DetachedSelect.__e34ScrollMetrics }));
    await page.waitForTimeout(750);
    const afterWait = await page.evaluate(() => {
      const element = (window as any).__e34DetachedSelect;
      element.__e34RestoreScrollIntoView();
      return { ...element.__e34ScrollMetrics };
    });
    expect(afterWait, `${framework} performed scroll work after disposal`).toEqual(atDispose);
  }
});

test('each adapter cancels deferred positioning after wheel interaction', async ({ page }) => {
  await page.goto(fixtureUrl);
  await expect.poll(() => page.evaluate(() => (window as any).__selectedOptionsFixtureReady)).toBe(true);

  for (const framework of frameworks) {
    const select = page.locator(`section[data-framework="${framework}"] enhanced-select`);
    await expect(select).toHaveCount(1);
    await page.evaluate((name) => {
      const updates = (window as any).__selectedOptionsAdapterUpdates as Map<string, (config: unknown) => void>;
      updates.get(name)?.({
        selectedOptions: { placement: 'original' },
        scrollToSelected: { enabled: true, onOpen: 'align', block: 'end' },
      });
    }, framework);
    await expect.poll(() => select.evaluate((element: any) => element._config.scrollToSelected.enabled)).toBe(true);

    await select.evaluate((element: any) => {
      element.style.setProperty('--select-dropdown-animation', 'dropdownEnter 600ms linear forwards');
      element.style.setProperty('--select-options-max-height', '40px');
    });
    await instrumentScroll(select);
    await select.evaluate((element: any) => element.open());
    await expect.poll(() => select.evaluate((element: any) => element._dropdown.getAnimations()
      .some((animation: Animation) => animation.playState === 'running'))).toBe(true);

    const beforeWheel = await select.evaluate((element: any) => ({ ...element.__e34ScrollMetrics }));
    await select.evaluate((element: any) => element._optionsContainer.dispatchEvent(
      new WheelEvent('wheel', { bubbles: true, deltaY: 1 }),
    ));
    await page.waitForTimeout(750);
    const afterEntrance = await select.evaluate((element: any) => {
      element.close();
      element.__e34RestoreScrollIntoView();
      return { ...element.__e34ScrollMetrics };
    });
    expect(afterEntrance, `${framework} scrolled after wheel cancelled deferred positioning`).toEqual(beforeWheel);
  }
});

test('each adapter has one automatic scroll owner for an offscreen selected target', async ({ page }) => {
  await page.goto(fixtureUrl);
  await expect.poll(() => page.evaluate(() => (window as any).__selectedOptionsFixtureReady)).toBe(true);

  for (const framework of frameworks) {
    const select = page.locator(`section[data-framework="${framework}"] enhanced-select`);
    await expect(select).toHaveCount(1);
    await page.evaluate((name) => {
      const updates = (window as any).__selectedOptionsAdapterUpdates as Map<string, (config: unknown) => void>;
      updates.get(name)?.({
        selectedOptions: { placement: 'original' },
        scrollToSelected: { enabled: true, onOpen: 'align', block: 'end', behavior: 'auto' },
      });
    }, framework);
    await expect.poll(() => select.evaluate((element: any) => element._config.scrollToSelected))
      .toMatchObject({ enabled: true, onOpen: 'align', block: 'end', behavior: 'auto' });
    await select.evaluate((element: any) => {
      element.style.setProperty('--select-dropdown-animation', 'dropdownEnter 100ms linear forwards');
      element.style.setProperty('--select-options-max-height', '40px');
    });
    await instrumentScroll(select);
    await select.evaluate((element: any) => element.open());
    await expect.poll(() => select.evaluate((element: any) => element._optionsContainer.scrollHeight
      > element._optionsContainer.clientHeight)).toBe(true);
    await page.waitForTimeout(200);

    const metrics = await select.evaluate((element: any) => {
      element.close();
      element.__e34RestoreScrollIntoView();
      return { ...element.__e34ScrollMetrics };
    });
    const positioningCalls = metrics.scrollTo + metrics.scrollIntoView;
    expect(positioningCalls, `${framework} should use at most one automatic scroll API`).toBeLessThanOrEqual(1);
    expect(metrics.scrollTopChanges, `${framework} should produce at most one immediate scrollTop movement`)
      .toBeLessThanOrEqual(1);
    expect(positioningCalls + metrics.scrollTopChanges, `${framework} should physically position its offscreen selected option`)
      .toBeGreaterThan(0);
  }
});
