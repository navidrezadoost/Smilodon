import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();
const runtimeEntry = path.join(root, 'packages/svelte/src/index.ts');
const declarationEntry = path.join(root, 'packages/svelte/src/index.d.ts');

function exportInventory(sourceText, fileName) {
  const source = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
  const values = new Set();
  const types = new Set();

  for (const statement of source.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
      continue;
    }

    const target = statement.isTypeOnly ? types : values;
    for (const element of statement.exportClause.elements) {
      const name = element.name.text;
      if (element.isTypeOnly) types.add(name);
      else target.add(name);
    }
  }

  return { values: [...values].sort(), types: [...types].sort() };
}

test('Svelte declaration value exports stay in parity with runtime value exports', async () => {
  const [runtimeText, declarationText] = await Promise.all([
    readFile(runtimeEntry, 'utf8'),
    readFile(declarationEntry, 'utf8'),
  ]);
  const runtime = exportInventory(runtimeText, runtimeEntry);
  const declaration = exportInventory(declarationText, declarationEntry);

  assert.deepEqual(runtime.values, ['Select', 'configureSelect', 'resetSelectConfig', 'selectConfig']);
  assert.deepEqual(declaration.values, runtime.values);
  assert.deepEqual(
    declaration.types.filter((name) => runtime.values.includes(name)),
    [],
    'runtime values must not be represented as type-only exports',
  );
});
