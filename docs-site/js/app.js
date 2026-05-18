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
      
      // Update current language display
      const currentLang = document.getElementById('currentLang');
      const currentFlag = document.getElementById('currentFlag');
      const selectedBtn = document.querySelector(`[data-lang="${lang}"]`);
      
      if (currentLang && selectedBtn) {
        currentLang.textContent = selectedBtn.textContent.trim();
      }
      
      if (currentFlag && selectedBtn) {
        const flagSrc = selectedBtn.querySelector('img')?.src;
        if (flagSrc) {
          currentFlag.src = flagSrc;
        }
      }
      
      // Update direction for RTL languages
      if (lang === 'fa' || lang === 'ar') {
        this.setDirection('rtl');
      } else {
        this.setDirection('ltr');
      }
      
      // Save language preference
      localStorage.setItem('smilodon-lang', lang);
    }
  }

  toggleDirection() {
    const current = document.documentElement.getAttribute('data-direction') || 'ltr';
    const newDirection = current === 'ltr' ? 'rtl' : 'ltr';
    this.setDirection(newDirection);
  }

  setDirection(direction) {
    document.documentElement.setAttribute('data-direction', direction);
    document.body.setAttribute('data-direction', direction);
    localStorage.setItem('smilodon-direction', direction);
    
    // Update playground
    if (window.playgroundManager) {
      window.playgroundManager.setDirection(direction);
    }
    
    // Update icon and label
    const icon = document.querySelector('#directionToggle use');
    const label = document.querySelector('#directionToggle .dir-label');
    if (icon) {
      icon.setAttribute('href', direction === 'ltr' ? '#icon-ltr' : '#icon-rtl');
    }
    if (label) {
      label.textContent = direction.toUpperCase();
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
    const codeBlocks = document.querySelectorAll('.doc-content pre, pre[class*="language-"]');

    const copyIcon = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;

    const successIcon = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    const setCopyState = (button) => {
      button.classList.remove('copied');
      button.setAttribute('aria-label', 'Copy code');
      button.setAttribute('title', 'Copy code');
      button.innerHTML = copyIcon;
    };

    const setCopiedState = (button) => {
      button.classList.add('copied');
      button.setAttribute('aria-label', 'Copied');
      button.setAttribute('title', 'Copied');
      button.innerHTML = successIcon;
    };
    
    codeBlocks.forEach(pre => {
      let wrapper = pre.parentElement;
      if (!wrapper || !wrapper.classList.contains('code-block-wrapper')) {
        wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
      }

      let button = pre.querySelector('.copy-code-btn');

      if (!button) {
        button = wrapper.querySelector('.copy-code-btn');
      }

      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-code-btn';
        wrapper.appendChild(button);
      } else if (button.parentElement !== wrapper) {
        wrapper.appendChild(button);
      }

      setCopyState(button);

      if (button.dataset.copyBound === 'true') {
        return;
      }

      button.dataset.copyBound = 'true';
      
      button.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        const text = code ? code.textContent : pre.textContent;
        
        try {
          await navigator.clipboard.writeText(text);
          setCopiedState(button);
          
          // Reset after 2 seconds
          setTimeout(() => {
            setCopyState(button);
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
            setCopiedState(button);
            setTimeout(() => {
              setCopyState(button);
            }, 2000);
          } catch (err2) {
            console.error('Fallback copy failed:', err2);
          }
          document.body.removeChild(textArea);
        }
      });
    });
  }
}

// Initialize app when script loads
window.smilodonApp = new App();
