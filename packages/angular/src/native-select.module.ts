import { NgModule } from '@angular/core';
import { NativeSelectComponent } from './native-select.component';

/**
 * Module that exports the NativeSelect component
 * 
 * @example
 * ```typescript
 * import { NativeSelectModule } from '@native-select/angular';
 * 
 * @NgModule({
 *   imports: [NativeSelectModule]
 * })
 * export class AppModule { }
 * ```
 */
@NgModule({
  imports: [NativeSelectComponent],
  exports: [NativeSelectComponent],
})
export class NativeSelectModule {}
