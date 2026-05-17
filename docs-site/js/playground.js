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
  }

  setMode(mode) {
    console.log('Setting mode:', mode);
    this.config.mode = mode;
    
    // Update button states
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });
    
    this.updateDemo();
  }

  setDataSize(size) {
    console.log('Setting data size:', size);
    this.config.dataSize = size;
    
    // Update button states
    document.querySelectorAll('[data-size]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-size')) === size);
    });
    
    this.updateDemo();
  }

  toggleFeature(feature, enabled) {
    console.log('Toggling feature:', feature, '=', enabled);
    this.config[feature] = enabled;
    this.updateDemo();
  }

  generateData(size) {
    const data = [];
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

    for (let i = 0; i < size; i++) {
      const item = items[i % items.length];
      const prefix = prefixes[Math.floor(i / items.length) % prefixes.length];
      const category = categories[Math.floor(i / (items.length * prefixes.length)) % categories.length];
      
      data.push({
        id: i + 1,
        label: `${prefix} ${item} #${i + 1}`,
        value: `item-${i + 1}`,
        category: this.config.grouped ? category : undefined,
      });
    }

    return data;
  }

  updateDemo() {
    const startTime = performance.now();
    const data = this.generateData(this.config.dataSize);
    
    // Clear container
    if (this.demoContainer) {
      this.demoContainer.innerHTML = '';
      
      // Create select based on framework
      const selectHTML = this.renderSelect(data);
      this.demoContainer.innerHTML = selectHTML;
      
      // Initialize the select (this would use actual Smilodon in production)
      this.initializeSelect(data);
    }
    
    const endTime = performance.now();
    
    // Update performance metrics
    this.performanceMetrics = {
      renderTime: (endTime - startTime).toFixed(2),
      itemsRendered: Math.min(data.length, this.config.virtualized ? 50 : data.length),
      totalItems: data.length,
    };
    
    this.updatePerformanceDisplay();
    this.updateConfigDisplay();
  }

  renderSelect(data) {
    // Render Smilodon select component
    const isMulti = this.config.mode === 'multi';
    const direction = this.config.rtl ? 'rtl' : 'ltr';
    
    let html = `
      <div class="demo-select-wrapper" dir="${direction}">
        <label for="demo-select" class="demo-label">
          ${isMulti ? 'Select multiple items' : 'Select an item'}
        </label>
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

  initializeSelect(data) {
    // Use customElements.whenDefined and add delay for element to be fully ready
    customElements.whenDefined('enhanced-select').then(() => {
      // Small delay to ensure the element is connected and ready
      setTimeout(() => {
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
        
        console.log('Initializing select with config:', JSON.stringify(this.config, null, 2));
        
        // Prepare data in the format expected by Smilodon
        const items = data.map(item => ({
          value: item.value,
          label: item.label,
          group: this.config.grouped ? item.category : undefined
        }));
        
        console.log('Setting items - Count:', items.length, 'Grouped:', this.config.grouped, 'First 3:', items.slice(0, 3));
        
        // Set items FIRST
        select.setItems(items);
        
        // Then configure features using updateConfig AFTER setItems
        const config = {
          searchable: this.config.searchable,
          virtualize: this.config.virtualized,
          infiniteScroll: {
            enabled: this.config.infiniteScroll,
            pageSize: 50,
            threshold: 100
          },
          selection: {
            mode: this.config.mode,
            closeOnSelect: this.config.mode === 'single'
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

  updateConfigDisplay() {
    const configList = document.querySelector('.config-list');
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
          <span class="config-value">${this.config.dataSize.toLocaleString()}</span>
        </div>
        ${this.config.searchable ? '<div class="config-item"><span class="config-label">Searchable:</span><span class="config-value">✓</span></div>' : ''}
        ${this.config.virtualized ? '<div class="config-item"><span class="config-label">Virtualized:</span><span class="config-value">✓</span></div>' : ''}
        ${this.config.infiniteScroll ? '<div class="config-item"><span class="config-label">Infinite Scroll:</span><span class="config-value">✓</span></div>' : ''}
        ${this.config.customRender ? '<div class="config-item"><span class="config-label">Custom Render:</span><span class="config-value">✓</span></div>' : ''}
        ${this.config.grouped ? '<div class="config-item"><span class="config-label">Grouped:</span><span class="config-value">✓</span></div>' : ''}
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
