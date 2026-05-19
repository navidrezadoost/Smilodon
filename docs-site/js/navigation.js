/**
 * Navigation Module
 * Handles sidebar navigation and page routing
 */

class NavigationManager {
  constructor() {
    this.sidebar = null;
    this.sidebarToggle = null;
    this.currentPage = 'home';
    this.init();
  }

  init() {
    this.sidebar = document.querySelector('.sidebar');
    this.sidebarToggle = document.querySelector('.sidebar-toggle');
    
    // Set up click handlers
    this.setupNavLinks();
    this.setupSidebarToggle();
    this.setupMobileClose();
    this.setupHashRouting();
    
    // Load initial page
    this.currentPage = window.location.hash.slice(1) || 'home';
    this.loadPage(this.currentPage);
    this.updateActiveState(this.currentPage);
  }

  setupNavLinks() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateTo(page);
      });
    });
  }

  setupSidebarToggle() {
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }
  }

  setupMobileClose() {
    // Close sidebar when clicking overlay on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && 
          this.sidebar.classList.contains('open') &&
          !this.sidebar.contains(e.target) && 
          !this.sidebarToggle.contains(e.target)) {
        this.closeSidebar();
      }
    });
  }

  toggleSidebar() {
    this.sidebar.classList.toggle('open');
  }

  closeSidebar() {
    this.sidebar.classList.remove('open');
  }

  navigateTo(page) {
    this.currentPage = page;
    window.location.hash = page;
    this.loadPage(page);
    this.updateActiveState(page);
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  }

  setupHashRouting() {
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.slice(1) || 'home';

      if (page === this.currentPage) {
        return;
      }

      this.currentPage = page;
      this.loadPage(page);
      this.updateActiveState(page);
    });
  }

  updateActiveState(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-page') === page);
    });
  }

  async loadPage(page) {
    const contentArea = document.querySelector('.main-content') || document.querySelector('main');
    
    // For home page, show playground
    if (page === 'home' || !page) {
      // Show hero and playground
      const heroSection = document.querySelector('.page[id="page-home"]');
      if (heroSection) {
        heroSection.classList.add('active');
        heroSection.style.display = 'block';
      }
      
      // Hide content page if exists
      const contentPage = document.querySelector('.content-page');
      if (contentPage) {
        contentPage.classList.remove('active');
        contentPage.style.display = 'none';
      }
    } else {
      // Hide home/playground page
      const heroSection = document.querySelector('.page[id="page-home"]');
      if (heroSection) {
        heroSection.classList.remove('active');
        heroSection.style.display = 'none';
      }
      
      // Show content page
      this.loadContentPage(page);
    }
  }

  loadContentPage(page) {
    // Get or create content page container
    let contentDiv = document.querySelector('.content-page');
    if (!contentDiv) {
      contentDiv = this.createContentPage();
    }
    
    // Remove hidden class and show
    contentDiv.classList.remove('hidden');
    contentDiv.classList.add('active');
    contentDiv.style.display = 'block';
    
    // Load content from documentationContent
    if (window.documentationContent && window.documentationContent[page]) {
      contentDiv.innerHTML = `
        <div class="doc-content">
          ${window.documentationContent[page]}
        </div>
      `;
    } else {
      // Fallback for pages without content yet
      contentDiv.innerHTML = `
        <div class="doc-content">
          <h1>Documentation: ${this.formatPageTitle(page)}</h1>
          <div class="doc-note">
            <p>📝 Content for this section is being prepared.</p>
            <p>In the meantime, check out the <a href="#home" class="nav-link" data-page="home">interactive playground</a> or explore other sections.</p>
          </div>
        </div>
      `;
    }
    
    // Add copy buttons to code blocks
    if (window.smilodonApp && window.smilodonApp.addCopyButtonsToCodeBlocks) {
      setTimeout(() => {
        window.smilodonApp.addCopyButtonsToCodeBlocks();
      }, 100);
    }
    
    // Apply syntax highlighting with Prism
    if (window.Prism) {
      setTimeout(() => {
        window.Prism.highlightAll();
      }, 150);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  }

  formatPageTitle(page) {
    return page
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  createContentPage() {
    const main = document.querySelector('main');
    const div = document.createElement('div');
    div.className = 'content-page';
    div.style.display = 'none';
    main.appendChild(div);
    return div;
  }
}

// Export singleton instance
window.navigationManager = new NavigationManager();
