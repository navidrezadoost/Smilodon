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
    // Language selector toggle
    const langBtn = document.getElementById('languageBtn');
    const langDropdown = document.getElementById('languageDropdown');
    
    if (langBtn && langDropdown) {
      langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('active');
        langBtn.classList.toggle('active');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
          langDropdown.classList.remove('active');
          langBtn.classList.remove('active');
        }
      });
    }
    
    // Language selector buttons
    const langBtns = document.querySelectorAll('[data-lang]');
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        this.changeLanguage(lang);
        
        // Close dropdown after selection
        if (langDropdown) {
          langDropdown.classList.remove('active');
          if (langBtn) langBtn.classList.remove('active');
        }
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
    const directionToggle = document.getElementById('directionToggle');
    if (directionToggle) {
      directionToggle.addEventListener('click', () => {
        this.toggleDirection();
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
    
    // Add copy buttons to code blocks
    this.addCopyButtonsToCodeBlocks();
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
  
  addCopyButtonsToCodeBlocks() {
    // Add copy buttons to all code blocks
    const codeBlocks = document.querySelectorAll('.doc-content pre');
    
    codeBlocks.forEach(pre => {
      // Skip if already has a copy button
      if (pre.querySelector('.copy-code-btn')) return;
      
      const button = document.createElement('button');
      button.className = 'copy-code-btn';
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;
      
      button.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        const text = code ? code.textContent : pre.textContent;
        
        try {
          await navigator.clipboard.writeText(text);
          
          // Update button state
          button.classList.add('copied');
          button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Copied!</span>
          `;
          
          // Reset after 2 seconds
          setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            `;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
          
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            button.classList.add('copied');
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.classList.remove('copied');
              button.textContent = 'Copy';
            }, 2000);
          } catch (err2) {
            console.error('Fallback copy failed:', err2);
          }
          document.body.removeChild(textArea);
        }
      });
      
      pre.appendChild(button);
    });
  }
}

// Initialize app when script loads
window.smilodonApp = new App();
