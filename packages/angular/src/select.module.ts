/**
 * Smilodon Select Module for Angular
 * 
 * Provides the SelectComponent for use in Angular applications.
 * The component can be used standalone or imported via this module.
 */

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectComponent } from './select.component';

@NgModule({
  imports: [CommonModule, SelectComponent],
  exports: [SelectComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SmilodonSelectModule {}
