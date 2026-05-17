/**
 * Customization Module
 * Handles style customization panel and live preview
 */

class CustomizationManager {
  constructor() {
    this.panel = null;
    this.overlay = null;
    this.styles = {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderRadius: '8',
      fontSize: '14',
      borderWidth: '1',
      spacing: '12',
      shadowIntensity: '0.1',
    };
    this.init();
  }

  init() {
    this.panel = document.querySelector('.customization-panel');
    this.overlay = document.querySelector('.overlay');
    
    this.setupToggleButton();
    this.setupCloseButton();
    this.setupOverlay();
    this.setupControls();
    this.applyStyles();
  }

  setupToggleButton() {
    const toggleBtn = document.getElementById('customizeBtn') || document.getElementById('customize-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.open();
      });
    }
  }

  setupCloseButton() {
    const closeBtn = document.querySelector('.close-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }
  }

  setupOverlay() {
    if (this.overlay) {
      this.overlay.addEventListener('click', () => {
        this.close();
      });
    }
  }

  setupControls() {
    // Color inputs
    document.querySelectorAll('[data-style-property]').forEach(input => {
      const property = input.getAttribute('data-style-property');
      
      // Set initial value
      if (this.styles[property]) {
        input.value = this.styles[property];
      }
      
      // Listen for changes
      input.addEventListener('input', (e) => {
        this.updateStyle(property, e.target.value);
      });
    });

    // Reset button
    const resetBtn = document.getElementById('reset-styles');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetStyles();
      });
    }

    // Export button
    const exportBtn = document.getElementById('export-styles');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportStyles();
      });
    }
  }

  updateStyle(property, value) {
    this.styles[property] = value;
    this.applyStyles();
    localStorage.setItem('smilodon-custom-styles', JSON.stringify(this.styles));
  }

  applyStyles() {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', this.styles.primaryColor);
    root.style.setProperty('--color-background', this.styles.backgroundColor);
    root.style.setProperty('--color-text', this.styles.textColor);
    root.style.setProperty('--border-radius', `${this.styles.borderRadius}px`);
    root.style.setProperty('--font-size-base', `${this.styles.fontSize}px`);
    root.style.setProperty('--border-width', `${this.styles.borderWidth}px`);
    root.style.setProperty('--spacing-base', `${this.styles.spacing}px`);
    root.style.setProperty('--shadow-opacity', this.styles.shadowIntensity);
    
    // Update demo select if exists
    this.updateDemoStyles();
  }

  updateDemoStyles() {
    const demoSelect = document.getElementById('demo-select');
    if (demoSelect) {
      demoSelect.style.borderColor = this.styles.primaryColor;
      demoSelect.style.borderRadius = `${this.styles.borderRadius}px`;
      demoSelect.style.fontSize = `${this.styles.fontSize}px`;
      demoSelect.style.padding = `${this.styles.spacing}px`;
    }
  }

  resetStyles() {
    this.styles = {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderRadius: '8',
      fontSize: '14',
      borderWidth: '1',
      spacing: '12',
      shadowIntensity: '0.1',
    };
    
    // Update all inputs
    document.querySelectorAll('[data-style-property]').forEach(input => {
      const property = input.getAttribute('data-style-property');
      if (this.styles[property]) {
        input.value = this.styles[property];
      }
    });
    
    this.applyStyles();
    localStorage.removeItem('smilodon-custom-styles');
  }

  exportStyles() {
    const css = this.generateCSS();
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smilodon-custom-theme.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateCSS() {
    return `
/* Smilodon Custom Theme */
:root {
  --color-primary: ${this.styles.primaryColor};
  --color-background: ${this.styles.backgroundColor};
  --color-text: ${this.styles.textColor};
  --border-radius: ${this.styles.borderRadius}px;
  --font-size-base: ${this.styles.fontSize}px;
  --border-width: ${this.styles.borderWidth}px;
  --spacing-base: ${this.styles.spacing}px;
  --shadow-opacity: ${this.styles.shadowIntensity};
}

/* Apply to Smilodon select */
.smilodon-select {
  --select-border-color: var(--color-primary);
  --select-border-radius: var(--border-radius);
  --select-font-size: var(--font-size-base);
  --select-padding: var(--spacing-base);
  --select-border-width: var(--border-width);
}
`;
  }

  open() {
    if (this.panel) {
      this.panel.classList.add('open');
    }
    if (this.overlay) {
      this.overlay.classList.add('active');
    }
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (this.panel) {
      this.panel.classList.remove('open');
    }
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  loadSavedStyles() {
    const saved = localStorage.getItem('smilodon-custom-styles');
    if (saved) {
      try {
        this.styles = JSON.parse(saved);
        this.applyStyles();
      } catch (e) {
        console.error('Failed to load saved styles:', e);
      }
    }
  }
}

// Export singleton instance
window.customizationManager = new CustomizationManager();
