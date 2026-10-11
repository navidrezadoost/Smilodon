import type { SelectEffect } from '../../engine/select-effects.js';

export interface WebSelectContext {
  focusTrigger?: () => void;
  syncAria?: () => void;
  onPopupOpened?: () => void;
  onPopupClosed?: (reason: Extract<SelectEffect, { type: 'POPUP_CLOSED' }>['reason']) => void;
}

export interface SelectEffectRunner {
  run(effects: readonly SelectEffect[], context: WebSelectContext): void;
}

export class DefaultSelectEffectRunner implements SelectEffectRunner {
  run(effects: readonly SelectEffect[], context: WebSelectContext): void {
    for (const effect of effects) {
      switch (effect.type) {
        case 'FOCUS_TRIGGER':
          context.focusTrigger?.();
          break;
        case 'SYNC_ARIA':
          context.syncAria?.();
          break;
        case 'POPUP_OPENED':
          context.onPopupOpened?.();
          break;
        case 'POPUP_CLOSED':
          context.onPopupClosed?.(effect.reason);
          break;
        case 'ACTIVE_KEY_CHANGED':
        case 'SELECTION_CHANGED':
          break;
      }
    }
  }
}
