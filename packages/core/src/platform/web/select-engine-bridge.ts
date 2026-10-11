import type { SelectKey } from '../../engine/contracts.js';
import type { SelectEffect } from '../../engine/select-effects.js';
import type { SelectEvent } from '../../engine/select-events.js';
import type { SelectState } from '../../engine/select-state.js';
import { createInitialSelectState } from '../../engine/select-state.js';
import { transition } from '../../engine/select-machine.js';

export class SelectEngineBridge<K extends SelectKey = SelectKey> {
  private _state: SelectState<K>;

  constructor(initialState: SelectState<K> = createInitialSelectState<K>()) {
    this._state = initialState;
  }

  get state(): SelectState<K> {
    return this._state;
  }

  dispatch(event: SelectEvent<K>): SelectEffect<K>[] {
    const result = transition(this._state, event);
    this._state = result.state;
    return result.effects;
  }
}
