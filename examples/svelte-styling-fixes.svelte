<script lang="ts">
  import Select from '@smilodon/svelte';
  
  const items = [
    { value: '1', label: 'Apple 🍎' },
    { value: '2', label: 'Banana 🍌' },
    { value: '3', label: 'Cherry 🍒' },
    { value: '4', label: 'Dragon Fruit 🐉' },
    { value: '5', label: 'Elderberry 🫐' },
    { value: '6', label: 'Fig 🌰' },
    { value: '7', label: 'Grape 🍇' },
    { value: '8', label: 'Honeydew 🍈' },
  ];
</script>

<div class="demo-container">
  <h1>🎨 Svelte - Styling Fixes Examples</h1>
  <p class="subtitle">
    All styling issues fixed: Arrow SVG, Separator, Dropdown Background, Option Borders
  </p>

  <!-- Test 1: Arrow Size Control -->
  <section class="test-section">
    <h2>1. Arrow SVG Size & Stroke Width Control</h2>
    <p class="description">✅ Fixed: Arrow now respects CSS variables</p>

    <div class="select-wrapper">
      <label>Default Arrow (16px, stroke-width: 2)</label>
      <Select
        {items}
        searchable
        placeholder="Select fruits..."
      />
    </div>

    <div class="select-wrapper">
      <label>Large Arrow (24px, stroke-width: 3)</label>
      <Select
        {items}
        searchable
        placeholder="Select fruits..."
        style="
          --select-arrow-size: 24px;
          --select-arrow-stroke-width: 3;
          --select-arrow-color: #10b981;
          --select-arrow-hover-color: #059669;
        "
      />
      <pre class="code-block">
style="
  --select-arrow-size: 24px;
  --select-arrow-stroke-width: 3;
  --select-arrow-color: #10b981;
  --select-arrow-hover-color: #059669;
"
      </pre>
    </div>
  </section>

  <!-- Test 2: Separator Control -->
  <section class="test-section">
    <h2>2. Separator Line Customization</h2>
    <p class="description">✅ Fixed: Added --select-separator-bg for solid colors</p>

    <div class="select-wrapper">
      <label>Custom Separator (3px, gradient)</label>
      <Select
        {items}
        searchable
        placeholder="Select fruits..."
        style="
          --select-separator-width: 3px;
          --select-separator-height: 80%;
          --select-separator-bg: linear-gradient(to bottom, #667eea 0%, #764ba2 100%);
          --select-separator-position: 50px;
        "
      />
      <pre class="code-block">
style="
  --select-separator-width: 3px;
  --select-separator-height: 80%;
  --select-separator-bg: linear-gradient(...);
  --select-separator-position: 50px;
"
      </pre>
    </div>
  </section>

  <!-- Test 3: Dropdown Background -->
  <section class="test-section">
    <h2>3. Dropdown & Options Background</h2>
    <p class="description">✅ Working: Fully customizable backgrounds</p>

    <div class="select-wrapper">
      <label>Custom Gray Background</label>
      <Select
        {items}
        searchable
        placeholder="Select fruits..."
        style="
          --select-dropdown-bg: #f9fafb;
          --select-options-bg: #f9fafb;
          --select-option-bg: #f9fafb;
          --select-option-hover-bg: #e5e7eb;
        "
      />
      <pre class="code-block">
style="
  --select-dropdown-bg: #f9fafb;
  --select-options-bg: #f9fafb;
  --select-option-bg: #f9fafb;
  --select-option-hover-bg: #e5e7eb;
"
      </pre>
    </div>
  </section>

  <!-- Test 4: Option Borders -->
  <section class="test-section">
    <h2>4. Option Borders in Multi-Select</h2>
    <p class="description">✅ Fixed: Added --select-option-border</p>

    <div class="select-wrapper">
      <label>Options with Borders</label>
      <Select
        {items}
        searchable
        multiple
        placeholder="Select multiple fruits..."
        style="
          --select-option-border: 1px solid #e5e7eb;
          --select-option-border-bottom: 1px solid #d1d5db;
          --select-option-padding: 12px 16px;
        "
      />
      <pre class="code-block">
style="
  --select-option-border: 1px solid #e5e7eb;
  --select-option-border-bottom: 1px solid #d1d5db;
  --select-option-padding: 12px 16px;
"
      </pre>
    </div>
  </section>

  <!-- Test 5: All Combined -->
  <section class="test-section">
    <h2>5. All Fixes Combined - Purple Theme</h2>
    <p class="description">Complete customization example</p>

    <div class="select-wrapper">
      <label>Fully Customized Select</label>
      <Select
        {items}
        searchable
        multiple
        placeholder="Select multiple fruits..."
        style="
          --select-arrow-size: 20px;
          --select-arrow-stroke-width: 2.5;
          --select-arrow-color: #8b5cf6;
          --select-arrow-hover-bg: rgba(139, 92, 246, 0.1);
          
          --select-separator-width: 2px;
          --select-separator-bg: #8b5cf6;
          --select-separator-height: 70%;
          
          --select-dropdown-bg: #faf5ff;
          --select-options-bg: #faf5ff;
          --select-option-bg: #faf5ff;
          --select-option-hover-bg: #f3e8ff;
          --select-option-selected-bg: #e9d5ff;
          
          --select-option-border: 1px solid #e9d5ff;
          --select-option-padding: 14px 18px;
          
          --select-input-border: 2px solid #8b5cf6;
          --select-input-border-radius: 8px;
        "
      />
      <pre class="code-block">
style="
  /* Arrow */
  --select-arrow-size: 20px;
  --select-arrow-stroke-width: 2.5;
  --select-arrow-color: #8b5cf6;
  
  /* Separator */
  --select-separator-width: 2px;
  --select-separator-bg: #8b5cf6;
  
  /* Dropdown & Options */
  --select-dropdown-bg: #faf5ff;
  --select-option-bg: #faf5ff;
  
  /* Option Borders */
  --select-option-border: 1px solid #e9d5ff;
"
      </pre>
    </div>
  </section>

  <!-- Test 6: Dark Theme -->
  <section class="test-section">
    <h2>6. Dark Theme Example</h2>
    <p class="description">Complete dark theme</p>

    <div class="select-wrapper">
      <label>Dark Mode Select</label>
      <Select
        {items}
        searchable
        multiple
        placeholder="Select fruits..."
        style="
          --select-arrow-size: 18px;
          --select-arrow-color: #818cf8;
          --select-arrow-stroke-width: 2;
          
          --select-separator-bg: linear-gradient(to bottom, transparent, #4b5563, transparent);
          
          --select-input-bg: #1f2937;
          --select-input-border: 1px solid #4b5563;
          --select-input-color: #f9fafb;
          
          --select-dropdown-bg: #1f2937;
          --select-options-bg: #1f2937;
          --select-option-bg: #1f2937;
          --select-option-color: #f9fafb;
          --select-option-hover-bg: #374151;
          --select-option-selected-bg: #4338ca;
          
          --select-option-border: none;
          --select-option-border-bottom: 1px solid #374151;
        "
      />
    </div>
  </section>
</div>

<style>
  .demo-container {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 {
    color: #333;
    margin-bottom: 10px;
  }

  .subtitle {
    color: #666;
    margin-bottom: 40px;
  }

  .test-section {
    margin-bottom: 40px;
  }

  .test-section h2 {
    color: #667eea;
    margin-bottom: 8px;
    font-size: 20px;
  }

  .description {
    color: #666;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .select-wrapper {
    margin-bottom: 30px;
  }

  .select-wrapper label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }

  .code-block {
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 15px;
    margin-top: 10px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    overflow-x: auto;
  }
</style>
