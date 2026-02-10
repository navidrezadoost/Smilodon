/**
 * Playground Scenario Definition
 */
export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'senior' | 'advanced';
  category: string;
  code: {
    typescript: string;
    react?: string;
    vue?: string;
    svelte?: string;
  };
  datasetSize?: number;
  expectedMetrics?: {
    renderTime?: number;
    scrollFPS?: number;
    memory?: number;
  };
  perfMeta?: {
    mode?: 'single' | 'multi';
    search?: 'none' | 'internal' | 'external-debounced';
    debounceMs?: number;
    render?: 'simple' | 'medium' | 'heavy';
  };
}

/**
 * All playground scenarios
 */
export const scenarios: Scenario[] = [
  {
    id: 'basic-select',
    title: 'Basic Single-Select',
    description: 'Simple single-selection dropdown with 100 items',
    difficulty: 'beginner',
    category: 'Getting Started',
    datasetSize: 100,
    expectedMetrics: {
      renderTime: 10,
      scrollFPS: 60,
      memory: 2
    },
    code: {
      typescript: `// Import the library
import { NativeSelectElement } from '@smilodon/core';

// Register custom element
customElements.define('smilodon-select', NativeSelectElement);

// Create container
const app = document.getElementById('app');

// Create select element
const select = document.createElement('smilodon-select');

// Set items
select.items = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  label: \`Item \${i + 1}\`
}));

// Listen for selection
select.addEventListener('select', (event) => {
  console.log('Selected:', event.detail.items[0]);
});

// Add to DOM
app.appendChild(select);

console.log('✓ Basic select created with 100 items');
`,
      react: `import { NativeSelect } from '@smilodon/react';
import { useState } from 'react';

function App() {
  const [selected, setSelected] = useState(null);
  
  const items = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    label: \`Item \${i + 1}\`
  }));
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Basic Single-Select</h2>
      <NativeSelect
        items={items}
        onSelect={({ items }) => {
          setSelected(items[0]);
          console.log('Selected:', items[0]);
        }}
      />
      {selected && (
        <p style={{ marginTop: '20px' }}>
          Selected: {selected.label}
        </p>
      )}
    </div>
  );
}

// Render
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
`
    }
  },
  
  {
    id: 'multi-select',
    title: 'Multi-Select & Chips',
    description: 'Multi-selection with visual chip display',
    difficulty: 'intermediate',
    category: 'Getting Started',
    datasetSize: 200,
    expectedMetrics: {
      renderTime: 15,
      scrollFPS: 60,
      memory: 3
    },
    code: {
      typescript: `import { NativeSelectElement } from '@smilodon/core';

customElements.define('smilodon-select', NativeSelectElement);

const app = document.getElementById('app');

// Create chips container
const chipsContainer = document.createElement('div');
chipsContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;';

// Create select
const select = document.createElement('smilodon-select');
select.multi = true;
select.items = Array.from({ length: 200 }, (_, i) => ({
  id: i,
  label: \`Option \${i + 1}\`,
  category: ['Fruits', 'Vegetables', 'Grains'][i % 3]
}));

// Template for custom rendering
select.optionTemplate = (item) => \`
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <span>\${item.label}</span>
    <small style="color: #666;">\${item.category}</small>
  </div>
\`;

// Update chips on selection
function updateChips(items) {
  chipsContainer.innerHTML = '';
  items.forEach(item => {
    const chip = document.createElement('div');
    chip.style.cssText = 'background: #e3f2fd; color: #1976d2; padding: 6px 12px; border-radius: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;';
    chip.innerHTML = \`
      \${item.label}
      <button style="background: none; border: none; cursor: pointer; font-size: 16px; color: #1976d2;">×</button>
    \`;
    
    chip.querySelector('button').addEventListener('click', () => {
      const newIndices = select.selectedIndices.filter(i => select.items[i].id !== item.id);
      select.selectedIndices = newIndices;
    });
    
    chipsContainer.appendChild(chip);
  });
}

select.addEventListener('select', (event) => {
  updateChips(event.detail.items);
  console.log(\`Selected \${event.detail.items.length} items\`);
});

app.appendChild(chipsContainer);
app.appendChild(select);

console.log('✓ Multi-select with chips created');
`
    }
  },
  
  {
    id: 'remote-search',
    title: 'Remote Search + SWR Cache',
    description: 'Async data loading with stale-while-revalidate caching',
    difficulty: 'intermediate',
    category: 'Data Loading',
    datasetSize: 1000,
    expectedMetrics: {
      renderTime: 30,
      scrollFPS: 60,
      memory: 5
    },
    code: {
      typescript: `import { NativeSelectElement } from '@smilodon/core';

customElements.define('smilodon-select', NativeSelectElement);

const app = document.getElementById('app');

// SWR Cache implementation
class SWRCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isStale = Date.now() - entry.timestamp > this.ttl;
    return { data: entry.data, isStale };
  }
  
  set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const cache = new SWRCache(30000); // 30s TTL

// Mock API
async function searchAPI(query) {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate latency
  
  // Generate mock results
  const allItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: \`User \${i + 1}\`,
    email: \`user\${i + 1}@example.com\`,
    role: ['Admin', 'User', 'Guest'][i % 3]
  }));
  
  if (!query) return allItems.slice(0, 50);
  
  return allItems.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.email.toLowerCase().includes(query.toLowerCase())
  );
}

// Create search input
const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.placeholder = 'Search users...';
searchInput.style.cssText = 'width: 100%; padding: 12px; margin-bottom: 16px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';

// Create select
const select = document.createElement('smilodon-select');
select.items = [];
select.estimatedItemHeight = 60;

select.optionTemplate = (item) => \`
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <strong>\${item.name}</strong>
    <div style="display: flex; justify-content: space-between;">
      <small style="color: #666;">\${item.email}</small>
      <small style="color: #1976d2;">\${item.role}</small>
    </div>
  </div>
\`;

// Loading indicator
const loading = document.createElement('div');
loading.textContent = 'Loading...';
loading.style.cssText = 'padding: 12px; color: #666; display: none;';

// Debounced search
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const query = e.target.value;
    const cacheKey = \`search:\${query}\`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      select.items = cached.data;
      console.log(\`✓ Loaded from cache (stale: \${cached.isStale})\`);
      
      if (cached.isStale) {
        // Revalidate in background
        const fresh = await searchAPI(query);
        cache.set(cacheKey, fresh);
        select.items = fresh;
        console.log('✓ Revalidated and updated');
      }
    } else {
      // Fetch fresh data
      loading.style.display = 'block';
      const results = await searchAPI(query);
      cache.set(cacheKey, results);
      select.items = results;
      loading.style.display = 'none';
      console.log(\`✓ Fetched \${results.length} results\`);
    }
  }, 300);
});

// Initial load
(async () => {
  const initial = await searchAPI('');
  cache.set('search:', initial);
  select.items = initial;
  console.log('✓ Initial data loaded');
})();

app.appendChild(searchInput);
app.appendChild(loading);
app.appendChild(select);
`
    }
  },
  
  {
    id: 'large-dataset',
    title: '50K Items - High Performance',
    description: 'Virtualized rendering with 50,000 items',
    difficulty: 'advanced',
    category: 'Performance',
    datasetSize: 50000,
    expectedMetrics: {
      renderTime: 50,
      scrollFPS: 60,
      memory: 12
    },
    code: {
      typescript: `import { NativeSelectElement } from '@smilodon/core';

customElements.define('smilodon-select', NativeSelectElement);

const app = document.getElementById('app');

// Generate 50K items efficiently
console.time('Data Generation');
const items = Array.from({ length: 50000 }, (_, i) => ({
  id: i,
  label: \`Item \${(i + 1).toLocaleString()}\`,
  value: Math.random() * 1000,
  category: ['A', 'B', 'C', 'D', 'E'][i % 5]
}));
console.timeEnd('Data Generation');

// Stats display
const stats = document.createElement('div');
stats.style.cssText = 'background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px; font-family: monospace;';
stats.innerHTML = \`
  <div><strong>Dataset:</strong> \${items.length.toLocaleString()} items</div>
  <div><strong>Memory:</strong> ~\${(JSON.stringify(items).length / 1048576).toFixed(2)} MB</div>
  <div id="render-stats"></div>
\`;

// Create select with performance tuning
const select = document.createElement('smilodon-select');
select.items = items;
select.estimatedItemHeight = 48;
select.buffer = 15; // Increased buffer for smoother scrolling

// Track render performance
const renderStart = performance.now();

select.addEventListener('open', () => {
  const renderTime = performance.now() - renderStart;
  const renderStats = document.getElementById('render-stats');
  renderStats.innerHTML = \`<div><strong>Render Time:</strong> \${renderTime.toFixed(2)}ms</div>\`;
  console.log(\`✓ Rendered in \${renderTime.toFixed(2)}ms\`);
});

// Track scroll performance
let frameCount = 0;
let lastTime = performance.now();

select.addEventListener('scroll', () => {
  frameCount++;
  const now = performance.now();
  const delta = now - lastTime;
  
  if (delta >= 1000) {
    const fps = Math.round(frameCount / (delta / 1000));
    console.log(\`Scroll FPS: \${fps}\`);
    frameCount = 0;
    lastTime = now;
  }
});

select.addEventListener('select', (event) => {
  console.log('Selected:', event.detail.items[0].label);
});

app.appendChild(stats);
app.appendChild(select);

console.log('✓ 50K item select initialized');
`
    }
  },

  {
    id: 'perf-100k',
    title: 'Perf: 100K Items (Dry Run)',
    description: '100,000 items with multi-select and debounced external search',
    difficulty: 'advanced',
    category: 'Performance',
    datasetSize: 100000,
    expectedMetrics: {
      renderTime: 80,
      scrollFPS: 60,
      memory: 18
    },
    perfMeta: {
      mode: 'multi',
      search: 'external-debounced',
      debounceMs: 300,
      render: 'simple'
    },
    code: {
      typescript: `import { NativeSelectElement } from '@smilodon/core';

customElements.define('smilodon-select', NativeSelectElement);

const app = document.getElementById('app');

const info = document.createElement('div');
info.style.cssText = 'background:#f9fafb;border:1px solid #e5e7eb;padding:12px 16px;border-radius:8px;margin-bottom:12px;font-family:system-ui;';
info.innerHTML = 
  '<strong>Perf: 100K Dry Run</strong><br/>' +
  'Multi-select enabled, external search (debounced 300ms), simple render.';

const searchInput = document.createElement('input');
searchInput.placeholder = 'Search (debounced 300ms)...';
searchInput.style.cssText = 'width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;margin-bottom:12px;';

console.time('Generate 100K items');
const items = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  label: 'Item ' + (i + 1).toLocaleString(),
  group: ['Alpha', 'Beta', 'Gamma', 'Delta'][i % 4]
}));
console.timeEnd('Generate 100K items');

const select = document.createElement('smilodon-select');
select.multi = true;
select.items = items;
select.searchable = false; // external debounced search
select.estimatedItemHeight = 44;
select.buffer = 15;

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const applySearch = debounce((query) => {
  const q = query.trim().toLowerCase();
  if (!q) {
    select.items = items;
    return;
  }
  const filtered = items.filter(item => item.label.toLowerCase().includes(q));
  select.items = filtered;
}, 300);

searchInput.addEventListener('input', (e) => {
  applySearch(e.target.value);
});

select.addEventListener('select', (event) => {
  console.log('Selected count:', event.detail.items.length);
});

app.appendChild(info);
app.appendChild(searchInput);
app.appendChild(select);

console.log('✓ Perf 100K scenario ready');
`
    }
  },

  {
    id: 'perf-1m-heavy',
    title: 'Perf: 1M Items (Heavy Render)',
    description: '1,000,000 items, multi-select, debounced search, heavy custom render',
    difficulty: 'advanced',
    category: 'Performance',
    datasetSize: 1000000,
    expectedMetrics: {
      renderTime: 120,
      scrollFPS: 58,
      memory: 120
    },
    perfMeta: {
      mode: 'multi',
      search: 'external-debounced',
      debounceMs: 300,
      render: 'heavy'
    },
    code: {
      typescript: `import { NativeSelectElement } from '@smilodon/core';

customElements.define('smilodon-select', NativeSelectElement);

const app = document.getElementById('app');

const info = document.createElement('div');
info.style.cssText = 'background:#fff7ed;border:1px solid #fed7aa;padding:12px 16px;border-radius:8px;margin-bottom:12px;font-family:system-ui;';
info.innerHTML = 
  '<strong>Perf: 1M Heavy</strong><br/>' +
  'Multi-select + debounced search + heavy custom render. Expect high CPU cost.';

const searchInput = document.createElement('input');
searchInput.placeholder = 'Search (debounced 300ms)...';
searchInput.style.cssText = 'width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;margin-bottom:12px;';

const status = document.createElement('div');
status.style.cssText = 'margin-bottom:12px;font-family:system-ui;font-size:13px;color:#6b7280;';
status.textContent = 'Generating 1,000,000 items...';

console.time('Generate 1M items');
const items = Array.from({ length: 1000000 }, (_, i) => ({
  id: i,
  label: 'Item ' + (i + 1).toLocaleString(),
  subtitle: 'Group ' + ['A','B','C','D'][i % 4] + ' • Score ' + (Math.random() * 100).toFixed(1),
  badge: ['NEW', 'HOT', 'PRO', 'VIP'][i % 4],
  color: ['#0ea5e9', '#6366f1', '#10b981', '#f97316'][i % 4]
}));
console.timeEnd('Generate 1M items');

status.textContent = '✓ 1M items ready. Use search + heavy rendering.';

const select = document.createElement('smilodon-select');
select.multi = true;
select.items = items;
select.searchable = false; // external debounced search
select.estimatedItemHeight = 68;
select.buffer = 20;

select.optionTemplate = (item) =>
  '<div style="display:flex;gap:12px;align-items:center;padding:6px 2px;">' +
    '<div style="width:36px;height:36px;border-radius:50%;background:' + item.color + ';display:flex;align-items:center;justify-content:center;color:white;font-weight:600;flex-shrink:0;">' +
      item.label.slice(5, 7) +
    '</div>' +
    '<div style="flex:1;min-width:0;">' +
      '<div style="display:flex;justify-content:space-between;gap:8px;">' +
        '<strong style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + item.label + '</strong>' +
        '<span style="background:#111827;color:white;border-radius:999px;padding:2px 8px;font-size:11px;">' + item.badge + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + item.subtitle + '</div>' +
      '<div style="margin-top:4px;font-size:11px;color:#9ca3af;">★ ★ ★ ★ ☆</div>' +
    '</div>' +
  '</div>';

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const applySearch = debounce((query) => {
  const q = query.trim().toLowerCase();
  if (!q) {
    select.items = items;
    return;
  }
  console.time('Filter 1M');
  const filtered = items.filter(item => item.label.toLowerCase().includes(q));
  console.timeEnd('Filter 1M');
  select.items = filtered;
}, 300);

searchInput.addEventListener('input', (e) => {
  applySearch(e.target.value);
});

select.addEventListener('select', (event) => {
  console.log('Selected count:', event.detail.items.length);
});

app.appendChild(info);
app.appendChild(status);
app.appendChild(searchInput);
app.appendChild(select);

console.log('✓ Perf 1M heavy scenario ready');
`
    }
  },
  
  {
    id: 'mega-dataset-worker',
    title: '1M Items - Web Worker Transform',
    description: 'Million-item dataset with worker-based filtering and sorting',
    difficulty: 'advanced',
    category: 'Performance',
    datasetSize: 1000000,
    expectedMetrics: {
      renderTime: 100,
      scrollFPS: 60,
      memory: 18
    },
    code: {
      typescript: `import { NativeSelectElement, WorkerManager } from '@smilodon/core';

customElements.define('smilodon-select', NativeSelectElement);

const app = document.getElementById('app');
const worker = new WorkerManager({ maxWorkers: 4 });

// Status display
const status = document.createElement('div');
status.style.cssText = 'background: #e3f2fd; color: #1976d2; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-weight: 600;';
status.textContent = 'Generating 1M items...';

// Generate 1M items
console.time('Generate 1M items');
const megaDataset = Array.from({ length: 1000000 }, (_, i) => ({
  id: i,
  label: \`Item \${(i + 1).toLocaleString()}\`,
  score: Math.random(),
  timestamp: Date.now() - Math.random() * 31536000000 // Random time in last year
}));
console.timeEnd('Generate 1M items');

status.textContent = '✓ 1M items generated. Try filtering...';

// Controls
const controls = document.createElement('div');
controls.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px;';

const filterInput = document.createElement('input');
filterInput.placeholder = 'Search (uses Web Worker)...';
filterInput.style.cssText = 'flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px;';

const sortButton = document.createElement('button');
sortButton.textContent = 'Sort by Score';
sortButton.style.cssText = 'padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;';

controls.appendChild(filterInput);
controls.appendChild(sortButton);

// Create select
const select = document.createElement('smilodon-select');
select.items = megaDataset.slice(0, 10000); // Start with first 10K
select.estimatedItemHeight = 48;
select.buffer = 20;

// Filter using worker
let filterTimeout;
filterInput.addEventListener('input', async (e) => {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(async () => {
    const query = e.target.value;
    if (!query) {
      select.items = megaDataset.slice(0, 10000);
      status.textContent = '✓ Showing first 10K items';
      return;
    }
    
    status.textContent = 'Filtering 1M items in worker...';
    console.time('Worker filter');
    
    const filtered = await worker.filter(megaDataset, query);
    
    console.timeEnd('Worker filter');
    select.items = filtered;
    status.textContent = \`✓ Found \${filtered.length.toLocaleString()} matches\`;
    console.log(\`Filtered to \${filtered.length} items\`);
  }, 300);
});

// Sort using worker
sortButton.addEventListener('click', async () => {
  status.textContent = 'Sorting 1M items in worker...';
  console.time('Worker sort');
  
  const sorted = await worker.sort(megaDataset, (a, b) => b.score - a.score);
  
  console.timeEnd('Worker sort');
  select.items = sorted.slice(0, 10000);
  status.textContent = '✓ Sorted and showing top 10K';
  console.log('Sorted complete');
});

// Cleanup
window.addEventListener('beforeunload', () => {
  worker.terminate();
});

app.appendChild(status);
app.appendChild(controls);
app.appendChild(select);

console.log('✓ 1M item demo initialized with Web Workers');
`
    }
  }
];

/**
 * Get scenarios grouped by category
 */
export function getScenariosByCategory(): Map<string, Scenario[]> {
  const groups = new Map<string, Scenario[]>();
  
  scenarios.forEach(scenario => {
    if (!groups.has(scenario.category)) {
      groups.set(scenario.category, []);
    }
    groups.get(scenario.category)!.push(scenario);
  });
  
  return groups;
}

/**
 * Get scenario by ID
 */
export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find(s => s.id === id);
}
