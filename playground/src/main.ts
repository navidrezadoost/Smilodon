import { scenarios, getScenariosByCategory, getScenarioById, type Scenario } from './scenarios';
import type * as Monaco from 'monaco-editor';

/**
 * Playground Application
 */
class PlaygroundApp {
  private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private monaco: typeof Monaco | null = null;
  private currentScenario: Scenario | null = null;
  private currentLang: 'typescript' | 'react' | 'vue' | 'svelte' = 'typescript';
  private sandboxReady = false;
  
  async init() {
    // Load Monaco Editor
    await this.loadMonaco();
    
    // Render sidebar scenarios
    this.renderSidebar();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial scenario from URL or default
    const urlParams = new URLSearchParams(window.location.search);
    const scenarioId = urlParams.get('scenario') || 'basic-select';
    this.loadScenario(scenarioId);
    
    // Initialize sandbox iframe
    this.initSandbox();
  }
  
  private async loadMonaco() {
    try {
      // Import Monaco from CDN
      const monaco = await import('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm');
      this.monaco = monaco as any;
      
      // Configure Monaco
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        allowJs: true,
        typeRoots: ['node_modules/@types']
      });
      
      // Create editor instance
      const container = document.getElementById('editor-container');
      if (!container) throw new Error('Editor container not found');
      
      this.editor = monaco.editor.create(container, {
        value: '// Loading...',
        language: 'typescript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on'
      });
      
      console.log('✓ Monaco Editor initialized');
    } catch (error) {
      console.error('Failed to load Monaco:', error);
    }
  }
  
  private renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const groups = getScenariosByCategory();
    sidebar.innerHTML = '';
    
    groups.forEach((scenarios, category) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'scenario-group';
      
      const titleEl = document.createElement('div');
      titleEl.className = 'scenario-group-title';
      titleEl.textContent = category;
      groupEl.appendChild(titleEl);
      
      scenarios.forEach(scenario => {
        const itemEl = document.createElement('div');
        itemEl.className = 'scenario-item';
        itemEl.dataset.scenarioId = scenario.id;
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = scenario.title;
        itemEl.appendChild(titleSpan);
        
        const badge = document.createElement('span');
        badge.className = `scenario-badge ${scenario.difficulty}`;
        badge.textContent = scenario.difficulty;
        itemEl.appendChild(badge);
        
        itemEl.addEventListener('click', () => {
          this.loadScenario(scenario.id);
        });
        
        groupEl.appendChild(itemEl);
      });
      
      sidebar.appendChild(groupEl);
    });
  }
  
  private setupEventListeners() {
    // Run button
    document.getElementById('run-btn')?.addEventListener('click', () => {
      this.runCode();
    });
    
    // Share button
    document.getElementById('share-btn')?.addEventListener('click', () => {
      this.shareScenario();
    });
    
    // Metrics button
    document.getElementById('metrics-btn')?.addEventListener('click', () => {
      const panel = document.getElementById('metrics-panel');
      panel?.classList.toggle('visible');
    });
    
    // Language tabs
    document.querySelectorAll('.panel-tab[data-lang]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const lang = (e.target as HTMLElement).dataset.lang as any;
        this.switchLanguage(lang);
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Enter to run
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.runCode();
      }
      
      // Ctrl/Cmd + S to save (share)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.shareScenario();
      }
    });
  }
  
  private initSandbox() {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (!iframe) return;
    
    // Load sandbox
    iframe.src = '/sandbox.html';
    
    // Listen for sandbox messages
    window.addEventListener('message', (event) => {
      if (event.data.type === 'sandbox-ready') {
        this.sandboxReady = true;
        console.log('✓ Sandbox ready');
      }
      
      if (event.data.type === 'console') {
        console.log(`[Sandbox ${event.data.level}]`, ...event.data.args);
      }
      
      if (event.data.type === 'execution-complete') {
        console.log(`✓ Execution completed in ${event.data.executionTime.toFixed(2)}ms`);
        this.updateMetrics();
      }
      
      if (event.data.type === 'execution-error') {
        console.error('[Sandbox Error]', event.data.error.message);
      }
      
      if (event.data.type === 'metrics') {
        this.displayMetrics(event.data.data);
      }
    });
  }
  
  private loadScenario(id: string) {
    const scenario = getScenarioById(id);
    if (!scenario) {
      console.error('Scenario not found:', id);
      return;
    }
    
    this.currentScenario = scenario;
    
    // Update UI
    document.querySelectorAll('.scenario-item').forEach(el => {
      el.classList.toggle('active', el.dataset.scenarioId === id);
    });
    
    // Update scenario info
    const infoEl = document.getElementById('scenario-info');
    if (infoEl) {
      infoEl.textContent = `${scenario.title} — ${scenario.description}`;
    }
    
    // Load code into editor
    const code = scenario.code[this.currentLang] || scenario.code.typescript;
    this.editor?.setValue(code);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('scenario', id);
    window.history.pushState({}, '', url);
    
    console.log(`✓ Loaded scenario: ${scenario.title}`);
  }
  
  private switchLanguage(lang: 'typescript' | 'react' | 'vue' | 'svelte') {
    this.currentLang = lang;
    
    // Update tab UI
    document.querySelectorAll('.panel-tab[data-lang]').forEach(tab => {
      tab.classList.toggle('active', (tab as HTMLElement).dataset.lang === lang);
    });
    
    // Load code for current scenario
    if (this.currentScenario) {
      const code = this.currentScenario.code[lang] || this.currentScenario.code.typescript;
      this.editor?.setValue(code);
      
      // Update Monaco language
      const monacoLang = lang === 'typescript' ? 'typescript' : 'typescript';
      const model = this.editor?.getModel();
      if (model && this.monaco) {
        this.monaco.editor.setModelLanguage(model, monacoLang);
      }
    }
  }
  
  private runCode() {
    if (!this.sandboxReady) {
      console.warn('Sandbox not ready yet');
      return;
    }
    
    const code = this.editor?.getValue();
    if (!code) return;
    
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (!iframe.contentWindow) return;
    
    // Send code to sandbox for execution
    iframe.contentWindow.postMessage({
      type: 'execute',
      code: code
    }, '*');
    
    console.log('⚡ Running code...');
  }
  
  private updateMetrics() {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (!iframe.contentWindow) return;
    
    // Request metrics from sandbox
    iframe.contentWindow.postMessage({ type: 'get-metrics' }, '*');
  }
  
  private displayMetrics(metrics: any) {
    if (metrics.memory) {
      const memEl = document.getElementById('metric-memory');
      if (memEl) memEl.textContent = `${metrics.memory.used} MB`;
    }
    
    // Update other metrics
    // (Render time and FPS are tracked by scenarios themselves)
  }
  
  private shareScenario() {
    const url = window.location.href;
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      console.log('✓ URL copied to clipboard');
      alert('Scenario URL copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}

// Initialize playground
const app = new PlaygroundApp();
app.init().catch(console.error);

console.log('🚀 Playground initialized');
