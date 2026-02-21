import { chromium } from 'playwright';

(async () => {
  const url = 'http://localhost:5173/vanilla-demo.html';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for the enhanced-select element
  await page.waitForSelector('enhanced-select');

  const result = await page.evaluate(async () => {
    const select = document.getElementById('fruit-select');
    if (!select) return { error: 'select-not-found' };

    const groups = [
      { label: 'Fruits', options: [ { value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' } ] },
      { label: 'Vegetables', options: [ { value: 'carrot', label: 'Carrot' }, { value: 'broccoli', label: 'Broccoli' } ] }
    ];

    // Set grouped items
    if (typeof select.setGroupedItems === 'function') {
      select.setGroupedItems(groups);
    } else {
      // fallback: flatten into items and setItems
      const items = groups.flatMap(g => g.options.map(o => ({ ...o, group: g.label })));
      if (typeof select.setItems === 'function') select.setItems(items);
    }

    // Open dropdown
    if (typeof select.open === 'function') select.open();

    // Wait for options to render
    await new Promise((res) => setTimeout(res, 120));

    const shadow = (select.shadowRoot);
    if (!shadow) return { error: 'no-shadow' };

    const headers = Array.from(shadow.querySelectorAll('.group-header')).map(h => ({ text: h.textContent?.trim(), bg: window.getComputedStyle(h).backgroundColor }));
    const options = Array.from(shadow.querySelectorAll('.option')).map(o => ({ text: o.textContent?.trim(), bg: window.getComputedStyle(o).backgroundColor, color: window.getComputedStyle(o).color }));

    // Now toggle dark mode on body and re-check computed styles
    document.body.classList.add('dark');
    await new Promise((res) => setTimeout(res, 120));

    const headersDark = Array.from(shadow.querySelectorAll('.group-header')).map(h => ({ text: h.textContent?.trim(), bg: window.getComputedStyle(h).backgroundColor }));
    const optionFirst = shadow.querySelector('.option');
    const optionFirstStyles = optionFirst ? { bg: window.getComputedStyle(optionFirst).backgroundColor, color: window.getComputedStyle(optionFirst).color } : null;

    return { headers, headersDark, optionFirst: optionFirstStyles, counts: { headers: headers.length, options: options.length } };
  });

  console.log('VERIFY RESULT:', JSON.stringify(result, null, 2));

  await browser.close();
  process.exit(result && !result.error ? 0 : 2);
})();
