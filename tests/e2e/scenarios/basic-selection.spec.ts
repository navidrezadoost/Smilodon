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
  
  test('@all @critical should navigate with keyboard', async ({ page }) => {
    const select = page.locator('enhanced-select').first();
    
    // Focus and open with keyboard
    await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const input = shadow?.querySelector('input');
      input?.focus();
    });
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    
    // Navigate down three times to get to Cherry (index 2: Apple=0, Banana=1, Cherry=2)
    // Starting from activeIndex -1, first ArrowDown goes to 0
    await page.keyboard.press('ArrowDown');  // to Apple (0)
    await page.keyboard.press('ArrowDown');  // to Banana (1)
    await page.keyboard.press('ArrowDown');  // to Cherry (2)
    
    // Select with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    
    // Verify selection
    const selectedValue = await select.evaluate((el: any) => {
      return el._state?.selectedItems?.values().next().value?.label;
    });
    
    expect(selectedValue).toBe('Cherry');
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
