/**
 * Performance telemetry module for tracking frame timing and performance metrics.
 * Uses PerformanceObserver for precise measurements.
 * 
 * Tracks:
 * - Frame time (should be < 16.67ms for 60fps)
 * - Main thread work per frame (target < 8ms, ideal 4-6ms)
 * - Long tasks (> 50ms blocks)
 * - Memory usage (if available)
 */

export interface FrameMetrics {
  frameTime: number; // milliseconds
  fps: number;
  longTasks: number; // count of frames > 16.67ms
  droppedFrames: number;
}

export interface PerformanceMetrics {
  frames: FrameMetrics;
  mainThreadWork: number; // average ms per frame
  longTaskCount: number;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export class PerformanceTelemetry {
  private frameTimes: number[] = [];
  private longTasks: number = 0;
  private lastFrameTime: number = 0;
  private rafId: number = 0;
  private measuring = false;
  private observer: PerformanceObserver | null = null;
  private workTimes: number[] = [];

  constructor() {
    this.setupObserver();
  }

  /**
   * Setup PerformanceObserver for long tasks
   */
  private setupObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask' && entry.duration > 50) {
            this.longTasks++;
          }
          if (entry.entryType === 'measure') {
            this.workTimes.push(entry.duration);
          }
        }
      });

      // Observe long tasks if supported
      try {
        this.observer.observe({ entryTypes: ['longtask', 'measure'] });
      } catch {
        // Fallback to just measure if longtask not supported
        this.observer.observe({ entryTypes: ['measure'] });
      }
    } catch (err) {
      console.warn('PerformanceObserver not available', err);
    }
  }

  /**
   * Start measuring frame performance
   */
  start(): void {
    if (this.measuring) return;
    
    this.measuring = true;
    this.frameTimes = [];
    this.workTimes = [];
    this.longTasks = 0;
    this.lastFrameTime = performance.now();
    
    this.measureFrame();
  }

  /**
   * Stop measuring
   */
  stop(): void {
    this.measuring = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  /**
   * Measure frame timing via requestAnimationFrame
   */
  private measureFrame = (): void => {
    if (!this.measuring) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    this.frameTimes.push(frameTime);
    
    // Keep last 60 frames (1 second at 60fps)
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
    
    this.lastFrameTime = now;
    this.rafId = requestAnimationFrame(this.measureFrame);
  };

  /**
   * Mark start of work for custom measurement
   */
  markStart(label: string): void {
    performance.mark(`${label}-start`);
  }

  /**
   * Mark end of work and measure duration
   */
  markEnd(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label, 'measure')[0];
    return measure ? measure.duration : 0;
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): PerformanceMetrics {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;
    
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    
    const longFrames = this.frameTimes.filter(t => t > 16.67).length;
    const droppedFrames = this.frameTimes.filter(t => t > 33.33).length; // > 2 frames
    
    const avgMainThreadWork = this.workTimes.length > 0
      ? this.workTimes.reduce((a, b) => a + b, 0) / this.workTimes.length
      : 0;

    const metrics: PerformanceMetrics = {
      frames: {
        frameTime: avgFrameTime,
        fps,
        longTasks: longFrames,
        droppedFrames,
      },
      mainThreadWork: avgMainThreadWork,
      longTaskCount: this.longTasks,
    };

    // Add memory info if available
    if ('memory' in performance && (performance as any).memory) {
      const mem = (performance as any).memory;
      metrics.memory = {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
      };
    }

    return metrics;
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceGood(): boolean {
    const metrics = this.getMetrics();
    
    // Target: 60fps (16.67ms), < 8ms main thread work, minimal long tasks
    return (
      metrics.frames.fps >= 55 && // Allow some variance
      metrics.mainThreadWork < 8 &&
      metrics.frames.longTasks < 3 // Max 5% long frames
    );
  }

  /**
   * Get detailed report as string
   */
  getReport(): string {
    const metrics = this.getMetrics();
    
    let report = '=== Performance Report ===\n';
    report += `FPS: ${metrics.frames.fps.toFixed(2)}\n`;
    report += `Avg Frame Time: ${metrics.frames.frameTime.toFixed(2)}ms\n`;
    report += `Long Frames (>16.67ms): ${metrics.frames.longTasks}\n`;
    report += `Dropped Frames (>33ms): ${metrics.frames.droppedFrames}\n`;
    report += `Avg Main Thread Work: ${metrics.mainThreadWork.toFixed(2)}ms\n`;
    report += `Long Tasks (>50ms): ${metrics.longTaskCount}\n`;
    
    if (metrics.memory) {
      const usedMB = (metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const limitMB = (metrics.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
      report += `Memory: ${usedMB}MB / ${limitMB}MB\n`;
    }
    
    report += `Status: ${this.isPerformanceGood() ? '✓ GOOD' : '✗ POOR'}\n`;
    
    return report;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameTimes = [];
    this.workTimes = [];
    this.longTasks = 0;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/**
 * Singleton instance
 */
let telemetry: PerformanceTelemetry | null = null;

export function getTelemetry(): PerformanceTelemetry {
  if (!telemetry) {
    telemetry = new PerformanceTelemetry();
  }
  return telemetry;
}

/**
 * Helper to measure async function execution
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  
  return { result, duration };
}

/**
 * Helper to measure sync function execution
 */
export function measureSync<T>(
  label: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  
  return { result, duration };
}
