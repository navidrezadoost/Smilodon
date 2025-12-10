import { test, expect } from '@playwright/test';

test.describe('Debug Shadow DOM', () => {
  test('check option rendering', async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');
    
    const select = page.locator('enhanced-select').first();
    
    // Open dropdown
    await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const input = shadow?.querySelector('input');
      input?.focus();
    });
    
    await page.waitForTimeout(200);
    
    // Check option structure
    const optionInfo = await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const options = shadow?.querySelectorAll('select-option');
      
      return Array.from(options).map((opt: any) => ({
        innerHTML: opt.innerHTML,
        textContent: opt.textContent,
        innerText: opt.innerText,
        label: opt.getAttribute('label'),
        value: opt.getAttribute('value'),
        hasShadowRoot: !!opt.shadowRoot
      }));
    });
    
    console.log('Options:', JSON.stringify(optionInfo, null, 2));
  });
  
  test('test option click', async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');
    
    const select = page.locator('enhanced-select').first();
    
    // Open dropdown
    await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const input = shadow?.querySelector('input');
      input?.focus();
    });
    
    await page.waitForTimeout(200);
    
    // Try clicking option
    const result = await select.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const option = shadow?.querySelectorAll('select-option')[1] as any;
      
      // Try multiple ways to click
      const beforeState = {
        selectedCount: el._state?.selectedItems?.size,
        optionConfig: option?._config?.item
      };
      
      // Try direct click
      option?.click();
      
      const afterClick = {
        selectedCount: el._state?.selectedItems?.size
      };
      
      // Try clicking the container in the option's shadow DOM
      const optionShadow = option?.shadowRoot;
      const container = optionShadow?.querySelector('.option-container');
      container?.click();
      
      const afterContainerClick = {
        selectedCount: el._state?.selectedItems?.size
      };
      
      return {
        beforeState,
        afterClick,
        afterContainerClick,
        hasContainer: !!container
      };
    });
    
    console.log('Option click test:', JSON.stringify(result, null, 2));
  });
});
