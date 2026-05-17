/**
 * Theme Management Module
 * Handles light/dark mode switching and persistence
 */

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('smilodon-theme') || 'light';
    this.themeToggleBtn = null;
    this.init();
  }

  init() {
    // Apply saved theme on load
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    
    // Update icon state
    this.updateThemeIcon();
    
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('smilodon-theme')) {
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  setTheme(theme, persist = true) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    if (persist) {
      localStorage.setItem('smilodon-theme', theme);
    }
    
    this.updateThemeIcon();
  }

  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  updateThemeIcon() {
    const icon = document.querySelector('#theme-toggle use');
    if (icon) {
      icon.setAttribute('href', this.currentTheme === 'light' ? '#icon-moon' : '#icon-sun');
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Export singleton instance
window.themeManager = new ThemeManager();
