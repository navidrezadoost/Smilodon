import { scenarios, getScenariosByCategory, getScenarioById, type Scenario } from './scenarios';
import type * as Monaco from 'monaco-editor';

if (import.meta.env.DEV) {
  (globalThis as any).__SMILODON_DEV__ = true;

  (globalThis as any).smilodonEnableFPSMeter = () => {
    const existing = document.getElementById('smilodon-fps-meter');
    if (existing) return () => existing.remove();

    const meter = document.createElement('div');
    meter.id = 'smilodon-fps-meter';
    meter.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'right:12px',
      'padding:6px 10px',
      'background:rgba(0,0,0,0.7)',
      'color:#fff',
      'font:12px/1.2 system-ui, sans-serif',
      'border-radius:6px',
      'z-index:9999',
    ].join(';');
    meter.textContent = 'FPS: --';
    document.body.appendChild(meter);

    let frames = 0;
    let lastTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      frames += 1;
      if (now - lastTime >= 1000) {
        meter.textContent = `FPS: ${frames}`;
        frames = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      meter.remove();
    };
  };
}

/**
 * Playground Application
 */
class PlaygroundApp {
  private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private monaco: typeof Monaco | null = null;
  private currentScenario: Scenario | null = null;
  private currentLang: 'typescript' | 'react' | 'vue' | 'svelte' = 'typescript';
  private sandboxReady = false;
  private perfEntries: Record<string, number> = {};
  private perfLog: Array<{
    timestamp: string;
    scenario: string;
    datasetSize?: number;
    perfMeta?: Scenario['perfMeta'];
    dropdownMs?: number;
    searchMs?: number;
  }> = [];
  private perfAutoInterval: number | null = null;
  private lastMemoryUsed: string | null = null;
  private fpsStats: { avg?: number | null; min?: number | null; max?: number | null; last?: number | null } | null = null;
  private sessionId: string | null = null;
  private sessionStartedAt: number | null = null;
  private durationInterval: number | null = null;
  
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

    // Perf controls
    document.getElementById('perf-refresh-btn')?.addEventListener('click', () => {
      this.requestPerfEntries();
    });

    document.getElementById('perf-auto-btn')?.addEventListener('click', () => {
      this.togglePerfAutoLog();
    });

    document.getElementById('perf-copy-json-btn')?.addEventListener('click', () => {
      this.copyPerfJson();
    });

    document.getElementById('perf-download-json-btn')?.addEventListener('click', () => {
      this.downloadPerfJson();
    });

    document.getElementById('perf-copy-md-btn')?.addEventListener('click', () => {
      this.copyPerfMarkdown();
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

      if (event.data.type === 'perf-entries') {
        this.updatePerfEntries(event.data.data);
      }

      if (event.data.type === 'fps-stats') {
        this.updateFpsStats(event.data.data);
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

    const itemsEl = document.getElementById('metric-items');
    if (itemsEl) {
      itemsEl.textContent = scenario.datasetSize ? scenario.datasetSize.toLocaleString() : '—';
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

    this.sessionId = Math.random().toString(36).slice(2, 10);
    this.sessionStartedAt = Date.now();
    this.fpsStats = null;
  this.startDurationTimer();
    
    console.log('⚡ Running code...');
  }

  private startDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }

    const durationEl = document.getElementById('metric-duration');
    if (durationEl) {
      durationEl.textContent = '0s';
    }

    this.durationInterval = window.setInterval(() => {
      if (!this.sessionStartedAt) return;
      const seconds = Math.floor((Date.now() - this.sessionStartedAt) / 1000);
      if (durationEl) {
        durationEl.textContent = `${seconds}s`;
      }
    }, 1000);
  }
  
  private updateMetrics() {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (!iframe.contentWindow) return;
    
    // Request metrics from sandbox
    iframe.contentWindow.postMessage({ type: 'get-metrics' }, '*');
    this.requestPerfEntries();
    this.requestFpsStats();
  }
  
  private displayMetrics(metrics: any) {
    if (metrics.memory) {
      const memEl = document.getElementById('metric-memory');
      if (memEl) memEl.textContent = `${metrics.memory.used} MB`;
      this.lastMemoryUsed = metrics.memory.used;
    }
    
    // Update other metrics
    // (Render time and FPS are tracked by scenarios themselves)
  }

  private requestPerfEntries() {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'get-perf-entries' }, '*');
  }

  private requestFpsStats() {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'get-fps-stats' }, '*');
  }

  private updatePerfEntries(entries: Array<{ name: string; duration: number }>) {
    const pickLatest = (name: string) => {
      const matching = entries.filter(entry => entry.name === name && entry.duration !== undefined);
      if (matching.length === 0) return undefined;
      return matching[matching.length - 1].duration;
    };

    const dropdownMs = pickLatest('smilodon-dropdown-to-first-render');
    const searchMs = pickLatest('smilodon-search-to-render');

    if (dropdownMs !== undefined) {
      this.perfEntries.dropdown = dropdownMs;
      const el = document.getElementById('metric-perf-dropdown');
      if (el) el.textContent = `${dropdownMs.toFixed(2)} ms`;
    }

    if (searchMs !== undefined) {
      this.perfEntries.search = searchMs;
      const el = document.getElementById('metric-perf-search');
      if (el) el.textContent = `${searchMs.toFixed(2)} ms`;
    }

    if (this.perfAutoInterval) {
      this.appendPerfLog(dropdownMs, searchMs);
    }
  }

  private updateFpsStats(stats: { avg?: number | null; min?: number | null; max?: number | null; last?: number | null }) {
    this.fpsStats = stats;
    const fpsEl = document.getElementById('metric-fps');
    if (!fpsEl) return;
    if (stats?.avg) {
      fpsEl.textContent = `${stats.avg.toFixed(1)} fps (avg)`;
    } else if (stats?.last) {
      fpsEl.textContent = `${stats.last} fps`;
    }
  }

  private appendPerfLog(dropdownMs?: number, searchMs?: number) {
    const scenario = this.currentScenario?.title || 'Unknown Scenario';
    const datasetSize = this.currentScenario?.datasetSize;
    const perfMeta = this.currentScenario?.perfMeta;
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, scenario, datasetSize, perfMeta, dropdownMs, searchMs };
    this.perfLog.unshift(entry);
    this.perfLog = this.perfLog.slice(0, 10);

    const logEl = document.getElementById('perf-log');
    if (logEl) {
      logEl.textContent = this.perfLog
        .map(log => {
          const parts = [
            `[${log.timestamp}] ${log.scenario}`,
            log.datasetSize ? `items: ${log.datasetSize.toLocaleString()}` : null,
            log.perfMeta?.mode ? `mode: ${log.perfMeta.mode}` : null,
            log.perfMeta?.search ? `search: ${log.perfMeta.search}` : null,
            log.perfMeta?.render ? `render: ${log.perfMeta.render}` : null,
            log.dropdownMs !== undefined ? `dropdown: ${log.dropdownMs.toFixed(2)}ms` : null,
            log.searchMs !== undefined ? `search: ${log.searchMs.toFixed(2)}ms` : null
          ].filter(Boolean);
          return parts.join(' | ');
        })
        .join('\n');
    }
  }

  private togglePerfAutoLog() {
    const btn = document.getElementById('perf-auto-btn');
    if (this.perfAutoInterval) {
      clearInterval(this.perfAutoInterval);
      this.perfAutoInterval = null;
      if (btn) btn.textContent = 'Auto Log: Off';
      return;
    }

    this.perfAutoInterval = window.setInterval(() => {
      this.requestPerfEntries();
    }, 2000);

    if (btn) btn.textContent = 'Auto Log: On';
  }

  private buildPerfReport() {
    const durationMs = this.sessionStartedAt ? Date.now() - this.sessionStartedAt : null;
    const durationSeconds = durationMs !== null ? Math.floor(durationMs / 1000) : null;
    return {
      session: {
        id: this.sessionId,
        startedAt: this.sessionStartedAt ? new Date(this.sessionStartedAt).toISOString() : null,
        durationMs,
        durationSeconds
      },
      scenario: {
        title: this.currentScenario?.title || 'Unknown Scenario',
        id: this.currentScenario?.id,
        datasetSize: this.currentScenario?.datasetSize,
        perfMeta: this.currentScenario?.perfMeta
      },
      fps: this.fpsStats,
      measures: {
        dropdownToFirstRenderMs: this.perfEntries.dropdown,
        searchToRenderMs: this.perfEntries.search
      },
      memory: {
        usedMB: this.lastMemoryUsed ? Number(this.lastMemoryUsed) : null
      },
      log: this.perfLog,
      capturedAt: new Date().toISOString()
    };
  }

  private async copyPerfJson() {
    const report = this.buildPerfReport();
    const summary = JSON.stringify(report, null, 2);
    try {
      await navigator.clipboard.writeText(summary);
      console.log('✓ Perf JSON copied to clipboard');
      alert('Perf JSON copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy perf JSON:', err);
    }
  }

  private downloadPerfJson() {
    const report = this.buildPerfReport();
    const payload = JSON.stringify(report, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const scenarioId = this.currentScenario?.id || 'scenario';
    link.href = url;
    link.download = `smilodon-perf-${scenarioId}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private buildPerfMarkdown() {
    const report = this.buildPerfReport();
    const datasetSize = report.scenario.datasetSize ? report.scenario.datasetSize.toLocaleString() : '—';
    const mode = report.scenario.perfMeta?.mode ?? '—';
    const search = report.scenario.perfMeta?.search ?? '—';
    const render = report.scenario.perfMeta?.render ?? '—';
    const duration = report.session.durationSeconds !== null && report.session.durationSeconds !== undefined
      ? `${report.session.durationSeconds}s`
      : '—';
    const avgFps = report.fps?.avg ? report.fps.avg.toFixed(1) : '—';
    const minFps = report.fps?.min ?? '—';
    const maxFps = report.fps?.max ?? '—';

    return [
      `## Perf Report — ${report.scenario.title}`,
      '',
      `- Session ID: ${report.session.id ?? '—'}`,
      `- Started: ${report.session.startedAt ?? '—'}`,
      `- Duration: ${duration}`,
      '',
      `- Dataset size: ${datasetSize}`,
      `- Mode: ${mode}`,
      `- Search: ${search}`,
      `- Render: ${render}`,
      '',
      `- Dropdown → first render: ${report.measures.dropdownToFirstRenderMs !== undefined ? report.measures.dropdownToFirstRenderMs.toFixed(2) + ' ms' : '—'}`,
      `- Search → render: ${report.measures.searchToRenderMs !== undefined ? report.measures.searchToRenderMs.toFixed(2) + ' ms' : '—'}`,
      `- FPS (avg/min/max): ${avgFps} / ${minFps} / ${maxFps}`,
      `- Memory (used MB): ${report.memory.usedMB ?? '—'}`,
      '',
      '### Recent Perf Log',
      ...report.log.map(log => {
        const parts = [
          `[${log.timestamp}] ${log.scenario}`,
          log.datasetSize ? `items: ${log.datasetSize.toLocaleString()}` : null,
          log.perfMeta?.mode ? `mode: ${log.perfMeta.mode}` : null,
          log.perfMeta?.search ? `search: ${log.perfMeta.search}` : null,
          log.perfMeta?.render ? `render: ${log.perfMeta.render}` : null,
          log.dropdownMs !== undefined ? `dropdown: ${log.dropdownMs.toFixed(2)}ms` : null,
          log.searchMs !== undefined ? `search: ${log.searchMs.toFixed(2)}ms` : null
        ].filter(Boolean);
        return `- ${parts.join(' | ')}`;
      })
    ].join('\n');
  }

  private async copyPerfMarkdown() {
    const summary = this.buildPerfMarkdown();
    try {
      await navigator.clipboard.writeText(summary);
      console.log('✓ Perf markdown copied to clipboard');
      alert('Perf markdown copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy perf markdown:', err);
    }
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
