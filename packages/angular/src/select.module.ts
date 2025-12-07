/**
 * Angular Module for Enhanced Select Component
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectComponent } from './select.component';

@NgModule({
  declarations: [SelectComponent],
  imports: [CommonModule],
  exports: [SelectComponent],
})
export class SmilodonSelectModule {}

// Export configuration helpers
export { configureSelect, resetSelectConfig } from '@smilodon/core';
export type { GlobalSelectConfig } from '@smilodon/core';
