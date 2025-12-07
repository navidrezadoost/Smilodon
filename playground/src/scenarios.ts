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
import { NativeSelectElement } from '@native-select/core';

// Register custom element
customElements.define('native-select', NativeSelectElement);

// Create container
const app = document.getElementById('app');

// Create select element
const select = document.createElement('native-select');

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
      react: `import { NativeSelect } from '@native-select/react';
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
      typescript: `import { NativeSelectElement } from '@native-select/core';

customElements.define('native-select', NativeSelectElement);

const app = document.getElementById('app');

// Create chips container
const chipsContainer = document.createElement('div');
chipsContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;';

// Create select
const select = document.createElement('native-select');
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
      typescript: `import { NativeSelectElement } from '@native-select/core';

customElements.define('native-select', NativeSelectElement);

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
const select = document.createElement('native-select');
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
      typescript: `import { NativeSelectElement } from '@native-select/core';

customElements.define('native-select', NativeSelectElement);

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
const select = document.createElement('native-select');
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
      typescript: `import { NativeSelectElement, WorkerManager } from '@native-select/core';

customElements.define('native-select', NativeSelectElement);

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
const select = document.createElement('native-select');
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
