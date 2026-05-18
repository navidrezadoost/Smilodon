/**
 * Customization Module
 * Handles style customization panel and live preview
 */

class CustomizationManager {
  constructor() {
    this.panel = null;
    this.overlay = null;
    this.toggleBtn = null;
    this.outputCode = null;
    this.lightThemePreview = null;
    this.darkThemePreview = null;
    this.demoObserver = null;
    this.playgroundDemo = null;
    this.styles = {
      primaryColor: '#3b82f6',
      lightBackgroundColor: '#ffffff',
      lightTextColor: '#1f2937',
      lightBorderColor: '#d1d5db',
      lightOptionBackgroundColor: '#ffffff',
      lightOptionTextColor: '#1f2937',
      lightOptionHoverBackgroundColor: '#eff6ff',
      selectedBackgroundColor: '#2563eb',
      selectedTextColor: '#ffffff',
      darkBackgroundColor: '#111827',
      darkTextColor: '#f9fafb',
      darkBorderColor: '#374151',
      darkOptionBackgroundColor: '#111827',
      darkOptionTextColor: '#f9fafb',
      darkOptionHoverBackgroundColor: '#1f2937',
      darkSelectedBackgroundColor: '#1d4ed8',
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
    this.toggleBtn = document.getElementById('customizeBtn') || document.getElementById('customize-btn');
    this.outputCode = document.getElementById('custom-css-output');
    this.lightThemePreview = document.getElementById('lightThemePreview');
    this.darkThemePreview = document.getElementById('darkThemePreview');
    this.playgroundDemo = document.getElementById('playgroundDemo');
    this.relocatePanel();
    
    this.setupToggleButton();
    this.setupCloseButton();
    this.setupOverlay();
    this.setupControls();
    this.setupDemoObserver();
    this.loadSavedStyles();
    this.applyStyles();
  }

  relocatePanel() {
    const playgroundDemo = document.getElementById('playgroundDemo');

    if (this.panel && playgroundDemo && playgroundDemo.firstChild !== this.panel) {
      playgroundDemo.insertBefore(this.panel, playgroundDemo.firstChild);
    }
  }

  setupToggleButton() {
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', 'false');
      this.toggleBtn.addEventListener('click', () => {
        if (this.panel?.classList.contains('active')) {
          this.close();
        } else {
          this.open();
        }
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
    return;
  }

  setupDemoObserver() {
    const demoContainer = document.getElementById('demo-container');
    if (!demoContainer) return;

    this.demoObserver = new MutationObserver(() => {
      this.updateDemoStyles();
    });

    this.demoObserver.observe(demoContainer, {
      childList: true,
      subtree: true,
    });
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

  hexToRgb(hex) {
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3
      ? normalized.split('').map(char => char + char).join('')
      : normalized;
    const parsed = Number.parseInt(value, 16);

    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255,
    };
  }

  toRgba(hex, alpha) {
    const { r, g, b } = this.hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getScopedSelectStyles() {
    const spacing = Number.parseFloat(this.styles.spacing) || 12;
    const fontSize = Number.parseFloat(this.styles.fontSize) || 14;
    const borderRadius = Number.parseFloat(this.styles.borderRadius) || 8;
    const borderWidth = Number.parseFloat(this.styles.borderWidth) || 1;
    const shadowIntensity = Number.parseFloat(this.styles.shadowIntensity) || 0.1;

    const compactOptionPaddingY = Math.max(4, Math.round(spacing * 0.45));
    const compactOptionPaddingX = Math.max(8, Math.round(spacing * 0.8));
    const compactInputPaddingY = Math.max(8, Math.round(spacing * 0.55));
    const compactInputPaddingX = Math.max(12, Math.round(spacing * 0.9));
    const compactMinHeight = Math.max(38, Math.round(fontSize * 2.7));
    const optionRadius = Math.max(4, borderRadius - 2);
    const shadow = `0 10px 24px ${this.toRgba(this.styles.primaryColor, shadowIntensity)}`;
    const selectedShadow = `0 6px 16px ${this.toRgba(this.styles.primaryColor, Math.min(shadowIntensity + 0.08, 0.35))}`;
    const lightBorder = this.styles.lightBorderColor || this.toRgba(this.styles.lightTextColor, 0.14);
    const darkBorder = this.styles.darkBorderColor || this.toRgba(this.styles.darkTextColor, 0.16);
    const lightHover = this.styles.lightOptionHoverBackgroundColor || this.toRgba(this.styles.primaryColor, 0.08);
    const darkHover = this.styles.darkOptionHoverBackgroundColor || this.toRgba(this.styles.primaryColor, 0.18);

    return {
      compactOptionPaddingY,
      compactOptionPaddingX,
      compactInputPaddingY,
      compactInputPaddingX,
      compactMinHeight,
      optionRadius,
      shadow,
      selectedShadow,
      lightBorder,
      darkBorder,
      lightHover,
      darkHover,
      borderWidth,
    };
  }

  applyStyles() {
    this.updateDemoStyles();
    this.renderThemePreviews();
    this.renderOutput();
  }

  updateDemoStyles() {
    const scoped = this.getScopedSelectStyles();

    document.querySelectorAll('enhanced-select.demo-select').forEach((demoSelect) => {
      demoSelect.style.setProperty('--select-primary', this.styles.primaryColor);
      demoSelect.style.setProperty('--select-accent', this.styles.primaryColor);
      demoSelect.style.setProperty('--select-border-focus', this.styles.primaryColor);
      demoSelect.style.setProperty('--select-input-bg', this.styles.lightBackgroundColor);
      demoSelect.style.setProperty('--select-surface', this.styles.lightBackgroundColor);
      demoSelect.style.setProperty('--select-text', this.styles.lightTextColor);
      demoSelect.style.setProperty('--select-dropdown-bg', this.styles.lightOptionBackgroundColor);
      demoSelect.style.setProperty('--select-dropdown-border', scoped.lightBorder);
      demoSelect.style.setProperty('--select-border', scoped.lightBorder);
      demoSelect.style.setProperty('--select-input-border', `${scoped.borderWidth}px solid ${scoped.lightBorder}`);
      demoSelect.style.setProperty('--select-input-border-radius', `${this.styles.borderRadius}px`);
      demoSelect.style.setProperty('--select-input-min-height', `${scoped.compactMinHeight}px`);
      demoSelect.style.setProperty('--select-input-padding', `${scoped.compactInputPaddingY}px 52px ${scoped.compactInputPaddingY}px ${scoped.compactInputPaddingX}px`);
      demoSelect.style.setProperty('--select-option-padding', `${scoped.compactOptionPaddingY}px ${scoped.compactOptionPaddingX}px`);
      demoSelect.style.setProperty('--select-option-font-size', `${this.styles.fontSize}px`);
      demoSelect.style.setProperty('--select-option-border-radius', `${scoped.optionRadius}px`);
      demoSelect.style.setProperty('--select-option-margin', '1px 0');
      demoSelect.style.setProperty('--select-dropdown-padding', '4px');
      demoSelect.style.setProperty('--select-dropdown-shadow', scoped.shadow);
      demoSelect.style.setProperty('--select-shadow-lg', scoped.shadow);
      demoSelect.style.setProperty('--select-option-bg', this.styles.lightOptionBackgroundColor);
      demoSelect.style.setProperty('--select-option-color', this.styles.lightOptionTextColor);
      demoSelect.style.setProperty('--select-option-hover-bg', scoped.lightHover);
      demoSelect.style.setProperty('--select-option-hover-color', this.styles.lightOptionTextColor);
      demoSelect.style.setProperty('--select-option-selected-bg', this.styles.selectedBackgroundColor);
      demoSelect.style.setProperty('--select-option-selected-hover-bg', this.styles.selectedBackgroundColor);
      demoSelect.style.setProperty('--select-option-selected-color', this.styles.selectedTextColor);
      demoSelect.style.setProperty('--select-option-selected-shadow', scoped.selectedShadow);
      demoSelect.style.setProperty('--select-option-transition', 'background 150ms ease, color 150ms ease, border 150ms ease, box-shadow 150ms ease');
      demoSelect.style.setProperty('--select-dark-bg', this.styles.darkBackgroundColor);
      demoSelect.style.setProperty('--select-dark-text', this.styles.darkTextColor);
      demoSelect.style.setProperty('--select-dark-border', scoped.darkBorder);
      demoSelect.style.setProperty('--select-dark-dropdown-bg', this.styles.darkOptionBackgroundColor);
      demoSelect.style.setProperty('--select-dark-option-bg', this.styles.darkOptionBackgroundColor);
      demoSelect.style.setProperty('--select-dark-option-color', this.styles.darkOptionTextColor);
      demoSelect.style.setProperty('--select-dark-option-hover-bg', scoped.darkHover);
      demoSelect.style.setProperty('--select-dark-option-hover-color', this.styles.darkOptionTextColor);
      demoSelect.style.setProperty('--select-dark-option-selected-bg', this.styles.darkSelectedBackgroundColor);
      demoSelect.style.setProperty('--select-dark-option-selected-hover-bg', this.styles.darkSelectedBackgroundColor);
      demoSelect.style.setProperty('--select-dark-option-selected-color', this.styles.selectedTextColor);
      demoSelect.style.setProperty('--select-dark-arrow-color', this.toRgba(this.styles.darkTextColor, 0.82));
    });
  }

  renderThemePreviews() {
    const scoped = this.getScopedSelectStyles();

    if (this.lightThemePreview) {
      this.lightThemePreview.style.background = `linear-gradient(135deg, ${this.styles.lightOptionBackgroundColor} 0%, ${scoped.lightHover} 100%)`;
      this.lightThemePreview.style.borderColor = scoped.lightBorder;
    }

    if (this.darkThemePreview) {
      this.darkThemePreview.style.background = `linear-gradient(135deg, ${this.styles.darkOptionBackgroundColor} 0%, ${scoped.darkHover} 100%)`;
      this.darkThemePreview.style.borderColor = scoped.darkBorder;
    }
  }

  resetStyles() {
    this.styles = {
      primaryColor: '#3b82f6',
      lightBackgroundColor: '#ffffff',
      lightTextColor: '#1f2937',
      lightBorderColor: '#d1d5db',
      lightOptionBackgroundColor: '#ffffff',
      lightOptionTextColor: '#1f2937',
      lightOptionHoverBackgroundColor: '#eff6ff',
      selectedBackgroundColor: '#2563eb',
      selectedTextColor: '#ffffff',
      darkBackgroundColor: '#111827',
      darkTextColor: '#f9fafb',
      darkBorderColor: '#374151',
      darkOptionBackgroundColor: '#111827',
      darkOptionTextColor: '#f9fafb',
      darkOptionHoverBackgroundColor: '#1f2937',
      darkSelectedBackgroundColor: '#1d4ed8',
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
    const scoped = this.getScopedSelectStyles();
    return `
/* Scoped Smilodon demo select theme */
enhanced-select.demo-select {
  --select-primary: ${this.styles.primaryColor};
  --select-accent: ${this.styles.primaryColor};
  --select-border-focus: ${this.styles.primaryColor};
  --select-input-bg: ${this.styles.lightBackgroundColor};
  --select-surface: ${this.styles.lightBackgroundColor};
  --select-text: ${this.styles.lightTextColor};
  --select-dropdown-bg: ${this.styles.lightOptionBackgroundColor};
  --select-dropdown-border: ${scoped.lightBorder};
  --select-border: ${scoped.lightBorder};
  --select-input-border: ${scoped.borderWidth}px solid ${scoped.lightBorder};
  --select-input-border-radius: ${this.styles.borderRadius}px;
  --select-input-min-height: ${scoped.compactMinHeight}px;
  --select-input-padding: ${scoped.compactInputPaddingY}px 52px ${scoped.compactInputPaddingY}px ${scoped.compactInputPaddingX}px;
  --select-option-padding: ${scoped.compactOptionPaddingY}px ${scoped.compactOptionPaddingX}px;
  --select-option-font-size: ${this.styles.fontSize}px;
  --select-option-border-radius: ${scoped.optionRadius}px;
  --select-option-margin: 1px 0;
  --select-dropdown-padding: 4px;
  --select-dropdown-shadow: ${scoped.shadow};
  --select-option-bg: ${this.styles.lightOptionBackgroundColor};
  --select-option-color: ${this.styles.lightOptionTextColor};
  --select-option-hover-bg: ${scoped.lightHover};
  --select-option-hover-color: ${this.styles.lightOptionTextColor};
  --select-option-selected-bg: ${this.styles.selectedBackgroundColor};
  --select-option-selected-hover-bg: ${this.styles.selectedBackgroundColor};
  --select-option-selected-color: ${this.styles.selectedTextColor};
  --select-option-selected-shadow: ${scoped.selectedShadow};
}

[data-theme="dark"] enhanced-select.demo-select {
  --select-dark-bg: ${this.styles.darkBackgroundColor};
  --select-dark-text: ${this.styles.darkTextColor};
  --select-dark-border: ${scoped.darkBorder};
  --select-dark-dropdown-bg: ${this.styles.darkOptionBackgroundColor};
  --select-dark-option-bg: ${this.styles.darkOptionBackgroundColor};
  --select-dark-option-color: ${this.styles.darkOptionTextColor};
  --select-dark-option-hover-bg: ${scoped.darkHover};
  --select-dark-option-hover-color: ${this.styles.darkOptionTextColor};
  --select-dark-option-selected-bg: ${this.styles.darkSelectedBackgroundColor};
  --select-dark-option-selected-hover-bg: ${this.styles.darkSelectedBackgroundColor};
  --select-dark-option-selected-color: ${this.styles.selectedTextColor};
}
`;
  }

  renderOutput() {
    if (!this.outputCode) return;

    this.outputCode.textContent = this.generateCSS().trim();

    if (window.Prism) {
      window.Prism.highlightElement(this.outputCode);
    }
  }

  open() {
    if (this.panel) {
      this.panel.classList.add('active');
    }
    if (this.playgroundDemo) {
      this.playgroundDemo.classList.add('with-customization-panel');
    }
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', 'true');
      this.toggleBtn.classList.add('active');
    }
  }

  close() {
    if (this.panel) {
      this.panel.classList.remove('active');
    }
    if (this.playgroundDemo) {
      this.playgroundDemo.classList.remove('with-customization-panel');
    }
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', 'false');
      this.toggleBtn.classList.remove('active');
    }
  }

  loadSavedStyles() {
    const saved = localStorage.getItem('smilodon-custom-styles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.styles = {
          ...this.styles,
          ...parsed,
          lightBackgroundColor: parsed.lightBackgroundColor || parsed.backgroundColor || this.styles.lightBackgroundColor,
          lightTextColor: parsed.lightTextColor || parsed.textColor || this.styles.lightTextColor,
          lightBorderColor: parsed.lightBorderColor || this.styles.lightBorderColor,
          lightOptionBackgroundColor: parsed.lightOptionBackgroundColor || parsed.lightBackgroundColor || parsed.backgroundColor || this.styles.lightOptionBackgroundColor,
          lightOptionTextColor: parsed.lightOptionTextColor || parsed.lightTextColor || parsed.textColor || this.styles.lightOptionTextColor,
          lightOptionHoverBackgroundColor: parsed.lightOptionHoverBackgroundColor || this.styles.lightOptionHoverBackgroundColor,
          selectedBackgroundColor: parsed.selectedBackgroundColor || parsed.primaryColor || this.styles.selectedBackgroundColor,
          selectedTextColor: parsed.selectedTextColor || this.styles.selectedTextColor,
          darkBorderColor: parsed.darkBorderColor || this.styles.darkBorderColor,
          darkOptionBackgroundColor: parsed.darkOptionBackgroundColor || parsed.darkBackgroundColor || this.styles.darkOptionBackgroundColor,
          darkOptionTextColor: parsed.darkOptionTextColor || parsed.darkTextColor || this.styles.darkOptionTextColor,
          darkOptionHoverBackgroundColor: parsed.darkOptionHoverBackgroundColor || this.styles.darkOptionHoverBackgroundColor,
          darkSelectedBackgroundColor: parsed.darkSelectedBackgroundColor || parsed.primaryColor || this.styles.darkSelectedBackgroundColor,
        };
        this.applyStyles();
      } catch (e) {
        console.error('Failed to load saved styles:', e);
      }
    }
  }
}

// Export singleton instance
window.customizationManager = new CustomizationManager();
