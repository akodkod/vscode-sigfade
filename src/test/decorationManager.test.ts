import * as assert from 'assert';
import * as vscode from 'vscode';
import { DecorationManager } from '../decorationManager';
import { createRubyDocument, createPlainTextDocument } from './helpers';

suite('DecorationManager', () => {
  let manager: DecorationManager;

  setup(() => {
    manager = new DecorationManager();
  });

  teardown(() => {
    manager.dispose();
  });

  test('applies decorations to Ruby file without throwing', async () => {
    const doc = await createRubyDocument([
      'sig { returns(String) }',
      'def foo; end',
    ].join('\n'));
    const editor = await vscode.window.showTextDocument(doc);
    assert.doesNotThrow(() => {
      manager.updateDecorations(editor, false);
    });
  });

  test('does not throw for non-Ruby files', async () => {
    const doc = await createPlainTextDocument('hello world');
    const editor = await vscode.window.showTextDocument(doc);
    assert.doesNotThrow(() => {
      manager.updateDecorations(editor, false);
    });
  });

  test('clearDecorations runs without error', async () => {
    const doc = await createRubyDocument('sig { returns(String) }');
    const editor = await vscode.window.showTextDocument(doc);
    assert.doesNotThrow(() => {
      manager.clearDecorations(editor);
    });
  });

  test('dispose cleans up without error', () => {
    assert.doesNotThrow(() => {
      manager.dispose();
    });
  });

  test('updateAllEditors processes without error', async () => {
    const doc = await createRubyDocument('sig { returns(String) }\ndef foo; end');
    await vscode.window.showTextDocument(doc);
    assert.doesNotThrow(() => {
      manager.updateAllEditors();
    });
  });
});
