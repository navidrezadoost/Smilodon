/**
 * Playground Module
 * Handles interactive demo functionality
 */

class PlaygroundManager {
  constructor() {
    this.currentFramework = 'vanilla';
    this.config = {
      mode: 'single',
      dataSize: 100,
      searchable: false,
      virtualized: false,
      infiniteScroll: false,
      customRender: false,
      grouped: false,
      rtl: false,
    };
    this.demoContainer = null;
    this.performanceMetrics = {
      renderTime: 0,
      itemsRendered: 0,
      totalItems: 0,
    };
    this._handleSelectChange = null;
    this._handleLoadMore = null;
    this._updateToken = 0;
    this._activeLoadMoreToken = 0;
    this.init();
  }

  init() {
    this.demoContainer = document.getElementById('demo-container');
    this.setupFrameworkSelection();
    this.setupControls();
    this.updateDemo();
  }

  setupFrameworkSelection() {
    document.querySelectorAll('.framework-card').forEach(card => {
      card.addEventListener('click', () => {
        const framework = card.getAttribute('data-framework');
        this.selectFramework(framework);
      });
    });
  }

  selectFramework(framework) {
    this.currentFramework = framework;
    
    // Update active state
    document.querySelectorAll('.framework-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-framework') === framework);
    });
    
    this.updateDemo();
  }

  setupControls() {
    // Mode buttons
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setMode(mode);
      });
    });

    // Data size buttons
    document.querySelectorAll('[data-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = parseInt(btn.getAttribute('data-size'));
        this.setDataSize(size);
      });
    });

    // Feature checkboxes
    document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const feature = checkbox.getAttribute('data-feature');
        this.toggleFeature(feature, checkbox.checked);
      });
    });

    this.syncControlStates();
  }

  setMode(mode) {
    console.log('Setting mode:', mode);
    this.config.mode = mode;
    
    // Update button states
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });
    
    this.syncControlStates();
    this.updateDemo();
  }

  setDataSize(size) {
    console.log('Setting data size:', size);
    this.config.dataSize = size;
    
    // Update button states
    document.querySelectorAll('[data-size]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-size')) === size);
    });
    
    this.syncControlStates();
    this.updateDemo();
  }

  toggleFeature(feature, enabled) {
    console.log('Toggling feature:', feature, '=', enabled);
    this.config[feature] = enabled;
    this.syncControlStates();
    this.updateDemo();
  }

  getEffectiveConfig() {
    const effective = { ...this.config };
    const isVeryLargeDataset = effective.dataSize >= 100000;
    const isLargeDataset = effective.dataSize >= 10000;

    if (isLargeDataset) {
      effective.virtualized = true;
    }

    if (isVeryLargeDataset) {
      effective.infiniteScroll = true;
      effective.grouped = false;
      effective.customRender = false;
    }

    effective.lazyMode = isVeryLargeDataset;
    effective.initialChunkSize = effective.lazyMode ? 1000 : effective.dataSize;
    effective.pageSize = effective.lazyMode ? 1000 : Math.min(1000, effective.dataSize);
    effective.itemsRenderedEstimate = effective.virtualized
      ? Math.min(effective.initialChunkSize, 50)
      : effective.initialChunkSize;

    return effective;
  }

  syncControlStates() {
    const effective = this.getEffectiveConfig();
    const featureCheckboxes = document.querySelectorAll('.feature-checkbox');

    featureCheckboxes.forEach((checkbox) => {
      const feature = checkbox.getAttribute('data-feature');
      const parentLabel = checkbox.closest('.checkbox-label');

      if (feature === 'virtualized') {
        checkbox.checked = effective.virtualized;
        checkbox.disabled = this.config.dataSize >= 10000;
      } else if (feature === 'infiniteScroll') {
        checkbox.checked = effective.infiniteScroll;
        checkbox.disabled = this.config.dataSize >= 100000;
      } else if (feature === 'grouped') {
        checkbox.checked = effective.grouped;
        checkbox.disabled = this.config.dataSize >= 100000;
      } else if (feature === 'customRender') {
        checkbox.checked = effective.customRender;
        checkbox.disabled = this.config.dataSize >= 100000;
      } else {
        checkbox.checked = Boolean(effective[feature]);
        checkbox.disabled = false;
      }

      if (parentLabel) {
        parentLabel.classList.toggle('is-disabled', checkbox.disabled);
      }
    });
  }

  createItem(index) {
    const categories = ['Fruits', 'Vegetables', 'Grains', 'Proteins', 'Dairy', 'Beverages'];
    const prefixes = ['Fresh', 'Organic', 'Premium', 'Classic', 'Deluxe', 'Special'];
    const items = [
      'Apple', 'Banana', 'Orange', 'Grape', 'Mango', 'Pear',
      'Carrot', 'Broccoli', 'Spinach', 'Tomato', 'Lettuce', 'Cucumber',
      'Rice', 'Wheat', 'Oats', 'Corn', 'Barley', 'Quinoa',
      'Chicken', 'Beef', 'Fish', 'Egg', 'Tofu', 'Beans',
      'Milk', 'Cheese', 'Yogurt', 'Butter', 'Cream', 'Ice Cream',
      'Coffee', 'Tea', 'Juice', 'Water', 'Soda', 'Smoothie'
    ];

    const item = items[index % items.length];
    const prefix = prefixes[Math.floor(index / items.length) % prefixes.length];
    const category = categories[Math.floor(index / (items.length * prefixes.length)) % categories.length];

    return {
      id: index + 1,
      label: `${prefix} ${item} #${index + 1}`,
      value: `item-${index + 1}`,
      category: this.config.grouped ? category : undefined,
    };
  }

  async yieldToMain() {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  generateData(size) {
    const data = [];
    for (let i = 0; i < size; i++) {
      data.push(this.createItem(i));
    }

    return data;
  }

  async generateDataAsync(size, offset = 0, token = this._updateToken) {
    const data = new Array(size);
    const batchSize = 2000;

    for (let i = 0; i < size; i++) {
      if (token !== this._updateToken && token !== this._activeLoadMoreToken) {
        return null;
      }

      data[i] = this.createItem(offset + i);

      if (i > 0 && i % batchSize === 0) {
        await this.yieldToMain();
      }
    }

    return data;
  }

  renderLoadingState(effectiveConfig) {
    if (!this.demoContainer) return;

    const lazyNotice = effectiveConfig.lazyMode
      ? `<p class="demo-status-note">Large dataset mode is enabled. The demo now streams items in pages and forces virtualization to keep the page responsive.</p>`
      : '';

    this.demoContainer.innerHTML = `
      <div class="demo-loading-state" role="status" aria-live="polite">
        <div class="demo-loading-spinner"></div>
        <div>
          <strong>Preparing demo…</strong>
          <p>Generating ${effectiveConfig.initialChunkSize.toLocaleString()} of ${effectiveConfig.dataSize.toLocaleString()} rows.</p>
          ${lazyNotice}
        </div>
      </div>
    `;
  }

  buildDemoNotice(effectiveConfig) {
    if (!effectiveConfig.lazyMode && !effectiveConfig.virtualized) {
      return '';
    }

    const notices = [];

    if (effectiveConfig.dataSize >= 10000) {
      notices.push('virtualization is forced for large datasets');
    }

    if (effectiveConfig.lazyMode) {
      notices.push('items load in 1,000-row pages');
      notices.push('grouping and custom rendering are disabled in this demo mode');
    }

    return `<div class="demo-runtime-note">Performance mode: ${notices.join(' • ')}.</div>`;
  }

  async updateDemo() {
    const token = ++this._updateToken;
    const startTime = performance.now();
    const effectiveConfig = this.getEffectiveConfig();
    const initialSize = Math.min(effectiveConfig.initialChunkSize, effectiveConfig.dataSize);

    this.renderLoadingState(effectiveConfig);
    await this.yieldToMain();

    const data = effectiveConfig.lazyMode
      ? await this.generateDataAsync(initialSize, 0, token)
      : await this.generateDataAsync(effectiveConfig.dataSize, 0, token);

    if (!data || token !== this._updateToken) {
      return;
    }
    
    // Clear container
    if (this.demoContainer) {
      this.demoContainer.innerHTML = '';
      
      // Create select based on framework
      const selectHTML = this.renderSelect(data, effectiveConfig);
      this.demoContainer.innerHTML = selectHTML;
      
      // Initialize the select (this would use actual Smilodon in production)
      this.initializeSelect(data, effectiveConfig, token);
    }
    
    const endTime = performance.now();
    
    // Update performance metrics
    this.performanceMetrics = {
      renderTime: (endTime - startTime).toFixed(2),
      itemsRendered: effectiveConfig.itemsRenderedEstimate,
      totalItems: effectiveConfig.dataSize,
    };
    
    this.updatePerformanceDisplay();
    this.updateConfigDisplay(effectiveConfig, data.length);
  }

  renderSelect(data, effectiveConfig = this.getEffectiveConfig()) {
    // Render Smilodon select component
    const isMulti = effectiveConfig.mode === 'multi';
    const direction = effectiveConfig.rtl ? 'rtl' : 'ltr';
    const runtimeNotice = this.buildDemoNotice(effectiveConfig);
    
    let html = `
      <div class="demo-select-wrapper" dir="${direction}">
        <label for="demo-select" class="demo-label">
          ${isMulti ? 'Select multiple items' : 'Select an item'}
        </label>
        ${runtimeNotice}
        <enhanced-select 
          id="demo-select" 
          class="demo-select"
          placeholder="Choose an option..."
        >
        </enhanced-select>
      </div>
    `;
    
    return html;
  }

  groupData(data) {
    return data.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }

  initializeSelect(data, effectiveConfig = this.getEffectiveConfig(), token = this._updateToken) {
    // Use customElements.whenDefined and add delay for element to be fully ready
    customElements.whenDefined('enhanced-select').then(() => {
      // Small delay to ensure the element is connected and ready
      setTimeout(() => {
        if (token !== this._updateToken) {
          return;
        }

        const select = document.getElementById('demo-select');
        if (!select) {
          console.error('Select element not found');
          return;
        }
        
        if (typeof select.setItems !== 'function') {
          console.error('setItems method not available on select');
          return;
        }
        
        if (typeof select.updateConfig !== 'function') {
          console.error('updateConfig method not available on select');
          return;
        }
        
        console.log('Initializing select with config:', JSON.stringify(effectiveConfig, null, 2));

        if (this._handleLoadMore) {
          select.removeEventListener('loadMore', this._handleLoadMore);
          this._handleLoadMore = null;
        }
        
        // Use different API based on grouped mode
        if (effectiveConfig.grouped) {
          // Group items by category for structured grouped data
          const groupedData = {};
          data.forEach(item => {
            const category = item.category || 'Other';
            if (!groupedData[category]) {
              groupedData[category] = [];
            }
            groupedData[category].push({
              value: item.value,
              label: item.label
            });
          });
          
          // Convert to GroupedItem[] format: [{ label: 'Fruits', options: [...] }, ...]
          const groupedItems = Object.keys(groupedData).map(category => ({
            label: category,
            options: groupedData[category]
          }));
          
          console.log('Setting grouped items:', groupedItems.length, 'groups', groupedItems.map(g => `${g.label} (${g.options.length})`));
          select.setGroupedItems(groupedItems);
        } else {
          // Flat items without grouping
          const items = data.map(item => ({
            value: item.value,
            label: item.label
          }));
          
          console.log('Setting items:', items.length);
          select.setItems(items);
        }
        
        // Then configure features using updateConfig AFTER setItems
        const config = {
          searchable: effectiveConfig.searchable,
          virtualize: effectiveConfig.virtualized,
          infiniteScroll: {
            enabled: effectiveConfig.infiniteScroll,
            pageSize: effectiveConfig.pageSize,
            threshold: 100
          },
          selection: {
            mode: effectiveConfig.mode,
            closeOnSelect: effectiveConfig.mode === 'single'
          }
        };
        
        console.log('Calling updateConfig with:', JSON.stringify(config, null, 2));
        select.updateConfig(config);
        
        // Force a re-render to ensure config is applied
        if (typeof select._renderOptions === 'function') {
          select._renderOptions();
        }
        
        // Add event listener for changes (only once)
        if (this._handleSelectChange) {
          select.removeEventListener('change', this._handleSelectChange);
        }
        this._handleSelectChange = (e) => {
          console.log('Selection changed:', e.detail);
        };
        select.addEventListener('change', this._handleSelectChange);
        
        if (effectiveConfig.lazyMode) {
          let loadedCount = data.length;
          let isLoadingMore = false;

          this._handleLoadMore = async () => {
            if (isLoadingMore || token !== this._updateToken || loadedCount >= effectiveConfig.dataSize) {
              return;
            }

            isLoadingMore = true;
            this._activeLoadMoreToken = token;

            const nextBatchSize = Math.min(effectiveConfig.pageSize, effectiveConfig.dataSize - loadedCount);
            const nextItems = await this.generateDataAsync(nextBatchSize, loadedCount, token);

            if (!nextItems || token !== this._updateToken) {
              isLoadingMore = false;
              return;
            }

            loadedCount += nextItems.length;
            const mergedItems = data.concat(nextItems);
            data.length = 0;
            data.push(...mergedItems);

            select.setItems(mergedItems.map(item => ({
              value: item.value,
              label: item.label
            })));

            this.updateConfigDisplay(effectiveConfig, loadedCount);
            isLoadingMore = false;
          };

          select.addEventListener('loadMore', this._handleLoadMore);
        }

        console.log('Select initialized successfully with mode:', config.selection.mode, 'searchable:', config.searchable);
      }, 50);
    }).catch(err => {
      console.error('Error initializing select:', err);
    });
  }

  updatePerformanceDisplay() {
    const elements = {
      renderTime: document.querySelector('[data-metric="renderTime"]'),
      itemsRendered: document.querySelector('[data-metric="itemsRendered"]'),
      totalItems: document.querySelector('[data-metric="totalItems"]'),
    };
    
    if (elements.renderTime) {
      elements.renderTime.textContent = `${this.performanceMetrics.renderTime}ms`;
    }
    if (elements.itemsRendered) {
      elements.itemsRendered.textContent = this.performanceMetrics.itemsRendered;
    }
    if (elements.totalItems) {
      elements.totalItems.textContent = this.performanceMetrics.totalItems.toLocaleString();
    }
  }

  updateConfigDisplay(effectiveConfig = this.getEffectiveConfig(), loadedCount = null) {
    const configList = document.querySelector('.config-list');
    const currentLoadedCount = loadedCount ?? Math.min(effectiveConfig.initialChunkSize, effectiveConfig.dataSize);
    if (configList) {
      configList.innerHTML = `
        <div class="config-item">
          <span class="config-label">Framework:</span>
          <span class="config-value">${this.currentFramework}</span>
        </div>
        <div class="config-item">
          <span class="config-label">Mode:</span>
          <span class="config-value">${this.config.mode}</span>
        </div>
        <div class="config-item">
          <span class="config-label">Data Size:</span>
          <span class="config-value">${effectiveConfig.dataSize.toLocaleString()}</span>
        </div>
        ${effectiveConfig.searchable ? '<div class="config-item"><span class="config-label">Searchable:</span><span class="config-value">✓</span></div>' : ''}
        ${effectiveConfig.virtualized ? '<div class="config-item"><span class="config-label">Virtualized:</span><span class="config-value">✓</span></div>' : ''}
        ${effectiveConfig.infiniteScroll ? '<div class="config-item"><span class="config-label">Infinite Scroll:</span><span class="config-value">✓</span></div>' : ''}
        ${effectiveConfig.customRender ? '<div class="config-item"><span class="config-label">Custom Render:</span><span class="config-value">✓</span></div>' : ''}
        ${effectiveConfig.grouped ? '<div class="config-item"><span class="config-label">Grouped:</span><span class="config-value">✓</span></div>' : ''}
        ${effectiveConfig.lazyMode ? `<div class="config-item"><span class="config-label">Loaded Now:</span><span class="config-value">${currentLoadedCount.toLocaleString()} / ${effectiveConfig.dataSize.toLocaleString()}</span></div>` : ''}
        ${effectiveConfig.lazyMode ? '<div class="config-item"><span class="config-label">Performance Mode:</span><span class="config-value">Lazy paging</span></div>' : ''}
      `;
    }
  }

  setDirection(direction) {
    this.config.rtl = direction === 'rtl';
    this.updateDemo();
  }
}

// Export singleton instance
window.playgroundManager = new PlaygroundManager();
