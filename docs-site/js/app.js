/**
 * Main Application Module
 * Orchestrates all other modules and initializes the application
 */

class App {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onReady());
    } else {
      this.onReady();
    }
  }

  onReady() {
    console.log('🦷 Smilodon Documentation Site - Initializing...');
    
    // Initialize all modules
    this.initializeModules();
    
    // Set up global event listeners
    this.setupGlobalListeners();
    
    // Load saved preferences
    this.loadPreferences();
    
    // Mark as initialized
    this.initialized = true;
    
    console.log('✅ Smilodon Documentation Site - Ready!');
  }

  initializeModules() {
    // i18n
    if (window.i18n) {
      window.i18n.updateDOM();
      console.log('✓ i18n initialized');
    }
    
    // Theme
    if (window.themeManager) {
      console.log('✓ Theme manager initialized');
    }
    
    // Navigation
    if (window.navigationManager) {
      console.log('✓ Navigation manager initialized');
    }
    
    // Playground
    if (window.playgroundManager) {
      console.log('✓ Playground manager initialized');
    }
    
    // Customization
    if (window.customizationManager) {
      window.customizationManager.loadSavedStyles();
      console.log('✓ Customization manager initialized');
    }
  }

  setupGlobalListeners() {
    // Language selector
    const langBtns = document.querySelectorAll('[data-lang]');
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        this.changeLanguage(lang);
      });
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        window.themeManager.toggle();
      });
    }
    
    // Direction toggle
    const directionToggle = document.getElementById('direction-toggle');
    if (directionToggle) {
      directionToggle.addEventListener('click', () => {
        this.toggleDirection();
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  changeLanguage(lang) {
    if (window.i18n) {
      window.i18n.setLanguage(lang);
      
      // Update active state on language buttons
      document.querySelectorAll('[data-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
      });
      
      // Update direction for RTL languages
      if (lang === 'fa' || lang === 'ar') {
        this.setDirection('rtl');
      } else {
        this.setDirection('ltr');
      }
    }
  }

  toggleDirection() {
    const current = document.documentElement.getAttribute('data-direction') || 'ltr';
    const newDirection = current === 'ltr' ? 'rtl' : 'ltr';
    this.setDirection(newDirection);
  }

  setDirection(direction) {
    document.documentElement.setAttribute('data-direction', direction);
    localStorage.setItem('smilodon-direction', direction);
    
    // Update playground
    if (window.playgroundManager) {
      window.playgroundManager.setDirection(direction);
    }
    
    // Update icon
    const icon = document.querySelector('#direction-toggle use');
    if (icon) {
      icon.setAttribute('href', direction === 'ltr' ? '#icon-ltr' : '#icon-rtl');
    }
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K: Open search (future feature)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      // Open search modal
    }
    
    // Ctrl/Cmd + /: Toggle theme
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      window.themeManager.toggle();
    }
    
    // Escape: Close any open panels
    if (e.key === 'Escape') {
      if (window.customizationManager) {
        window.customizationManager.close();
      }
    }
  }

  loadPreferences() {
    // Load saved direction
    const savedDirection = localStorage.getItem('smilodon-direction');
    if (savedDirection) {
      this.setDirection(savedDirection);
    }
    
    // Load saved language
    const savedLang = localStorage.getItem('smilodon-lang');
    if (savedLang && window.i18n) {
      document.querySelectorAll('[data-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === savedLang);
      });
    }
  }
}

// Initialize app when script loads
window.smilodonApp = new App();
