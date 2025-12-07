/**
 * Web Worker for generating large datasets
 * Handles 50K-1M item generation without blocking main thread
 */

interface GenerateRequest {
  type: 'generate';
  count: number;
  complexity: 'simple' | 'complex';
  seed?: number;
}

interface GenerateResponse {
  type: 'data';
  items: any[];
  stats: {
    count: number;
    generationTime: number;
    memoryEstimate: number;
  };
}

// LRU Cache for generated data
const cache = new Map<string, any[]>();
const MAX_CACHE_SIZE = 5;

// Simple seeded random (for reproducible data)
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Data generators
const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home', 'Beauty', 'Toys', 'Garden', 'Automotive'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];

function generateSimpleItem(index: number, rng: SeededRandom) {
  return {
    id: `item-${index}`,
    label: `Item ${index}`,
    value: index
  };
}

function generateComplexItem(index: number, rng: SeededRandom) {
  const firstName = firstNames[Math.floor(rng.next() * firstNames.length)];
  const lastName = lastNames[Math.floor(rng.next() * lastNames.length)];
  const category = categories[Math.floor(rng.next() * categories.length)];
  const city = cities[Math.floor(rng.next() * cities.length)];
  
  return {
    id: `item-${index}`,
    label: `${firstName} ${lastName}`,
    value: index,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    category: category,
    price: Math.floor(rng.next() * 10000) / 100,
    inStock: rng.next() > 0.3,
    rating: Math.floor(rng.next() * 5) + 1,
    city: city,
    tags: [
      category,
      rng.next() > 0.5 ? 'featured' : null,
      rng.next() > 0.7 ? 'sale' : null
    ].filter(Boolean)
  };
}

function generateData(count: number, complexity: 'simple' | 'complex', seed: number = Date.now()): any[] {
  const cacheKey = `${count}-${complexity}-${seed}`;
  
  // Check cache
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  const rng = new SeededRandom(seed);
  const items: any[] = [];
  const generator = complexity === 'simple' ? generateSimpleItem : generateComplexItem;
  
  // Generate in chunks for better performance
  const CHUNK_SIZE = 10000;
  for (let i = 0; i < count; i += CHUNK_SIZE) {
    const chunkSize = Math.min(CHUNK_SIZE, count - i);
    for (let j = 0; j < chunkSize; j++) {
      items.push(generator(i + j, rng));
    }
  }
  
  // Update cache
  cache.set(cacheKey, items);
  if (cache.size > MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  
  return items;
}

// Message handler
self.addEventListener('message', (event: MessageEvent<GenerateRequest>) => {
  if (event.data.type === 'generate') {
    const startTime = performance.now();
    
    const items = generateData(
      event.data.count,
      event.data.complexity,
      event.data.seed
    );
    
    const generationTime = performance.now() - startTime;
    
    // Estimate memory usage (rough calculation)
    const sampleSize = JSON.stringify(items.slice(0, 100)).length;
    const memoryEstimate = Math.round((sampleSize / 100) * items.length / 1024 / 1024 * 10) / 10;
    
    const response: GenerateResponse = {
      type: 'data',
      items,
      stats: {
        count: items.length,
        generationTime,
        memoryEstimate
      }
    };
    
    self.postMessage(response);
  }
});

console.log('[Worker] Data generator ready');
