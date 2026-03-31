import * as assert from 'assert';
import * as vscode from 'vscode';
import { findSigBlocks, isCursorInSigBlock, getCachedSigBlocks, clearCache } from '../sigBlockFinder';
import { createRubyDocument } from './helpers';

suite('findSigBlocks', () => {

  // --- Single-line brace sigs ---

  test('finds a single-line sig with braces', async () => {
    const doc = await createRubyDocument('sig { returns(String) }');
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[0].endLine, 0);
    assert.strictEqual(blocks[0].range.start.character, 0);
    assert.strictEqual(blocks[0].range.end.character, 23);
  });

  test('finds single-line sig with leading whitespace', async () => {
    const doc = await createRubyDocument('  sig { returns(String) }');
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].range.start.character, 2);
  });

  test('finds multiple single-line sigs', async () => {
    const content = [
      'sig { returns(String) }',
      'def foo; end',
      'sig { returns(Integer) }',
      'def bar; end',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 2);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[1].startLine, 2);
  });

  // --- Multi-line brace sigs ---

  test('finds multi-line brace sig', async () => {
    const content = [
      'sig {',
      '  params(x: Integer)',
      '  .returns(String)',
      '}',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[0].endLine, 3);
  });

  test('finds multi-line brace sig with nested braces', async () => {
    const content = [
      'sig {',
      '  params(x: T::Hash[Symbol, String])',
      '  .returns(String)',
      '}',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[0].endLine, 3);
  });

  // --- Inline-start multi-line brace sigs ---

  test('finds inline-start multi-line brace sig', async () => {
    const content = [
      'sig { params(',
      '  x: Integer',
      ').returns(String) }',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[0].endLine, 2);
  });

  // --- Multi-line do...end sigs ---

  test('finds sig do...end block', async () => {
    const content = [
      'sig do',
      '  params(x: Integer)',
      '  .returns(String)',
      'end',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[0].endLine, 3);
  });

  test('finds indented sig do...end', async () => {
    const content = [
      '    sig do',
      '      params(x: Integer)',
      '    end',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].range.start.character, 4);
  });

  // --- Mixed ---

  test('finds mixed sig styles in one document', async () => {
    const content = [
      'sig { returns(String) }',
      'def foo; end',
      '',
      'sig {',
      '  params(x: Integer)',
      '  .returns(String)',
      '}',
      'def bar(x); end',
      '',
      'sig do',
      '  returns(Integer)',
      'end',
      'def baz; end',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 3);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[1].startLine, 3);
    assert.strictEqual(blocks[2].startLine, 9);
  });

  // --- Edge cases ---

  test('returns empty array for no sigs', async () => {
    const doc = await createRubyDocument('def foo; end\ndef bar; end');
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 0);
  });

  test('returns empty array for empty document', async () => {
    const doc = await createRubyDocument('');
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 0);
  });

  test('returns empty array for blank lines only', async () => {
    const doc = await createRubyDocument('\n\n\n');
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 0);
  });

  // --- Range accuracy ---

  test('range excludes trailing whitespace', async () => {
    const doc = await createRubyDocument('sig { returns(String) }   ');
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].range.end.character, 23);
  });

  test('range start.character matches indentation', async () => {
    const doc = await createRubyDocument('    sig { returns(String) }');
    const blocks = findSigBlocks(doc);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].range.start.character, 4);
  });
});

suite('isCursorInSigBlock', () => {

  test('returns true for cursor on sig start line', async () => {
    const doc = await createRubyDocument('sig { returns(String) }');
    const blocks = findSigBlocks(doc);
    const pos = new vscode.Position(0, 5);
    assert.strictEqual(isCursorInSigBlock(pos, blocks), true);
  });

  test('returns true for cursor in middle of multi-line sig', async () => {
    const content = [
      'sig {',
      '  params(x: Integer)',
      '  .returns(String)',
      '}',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    const pos = new vscode.Position(1, 5);
    assert.strictEqual(isCursorInSigBlock(pos, blocks), true);
  });

  test('returns true for cursor on sig end line', async () => {
    const content = [
      'sig {',
      '  params(x: Integer)',
      '}',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    const pos = new vscode.Position(2, 0);
    assert.strictEqual(isCursorInSigBlock(pos, blocks), true);
  });

  test('returns false for cursor on method def line', async () => {
    const content = [
      'sig { returns(String) }',
      'def foo; end',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    const pos = new vscode.Position(1, 0);
    assert.strictEqual(isCursorInSigBlock(pos, blocks), false);
  });

  test('returns false for cursor before sig', async () => {
    const content = [
      '# comment',
      'sig { returns(String) }',
    ].join('\n');
    const doc = await createRubyDocument(content);
    const blocks = findSigBlocks(doc);
    const pos = new vscode.Position(0, 0);
    assert.strictEqual(isCursorInSigBlock(pos, blocks), false);
  });

  test('returns false with empty sigBlocks array', () => {
    const pos = new vscode.Position(0, 0);
    assert.strictEqual(isCursorInSigBlock(pos, []), false);
  });
});

suite('getCachedSigBlocks / clearCache', () => {

  test('returns same blocks as findSigBlocks', async () => {
    const doc = await createRubyDocument('sig { returns(String) }');
    clearCache(doc.uri);
    const direct = findSigBlocks(doc);
    const cached = getCachedSigBlocks(doc);
    assert.strictEqual(cached.length, direct.length);
    assert.strictEqual(cached[0].startLine, direct[0].startLine);
    assert.strictEqual(cached[0].endLine, direct[0].endLine);
  });

  test('returns same array reference on second call (cache hit)', async () => {
    const doc = await createRubyDocument('sig { returns(String) }');
    clearCache(doc.uri);
    const first = getCachedSigBlocks(doc);
    const second = getCachedSigBlocks(doc);
    assert.strictEqual(first, second);
  });

  test('returns new array reference after clearCache', async () => {
    const doc = await createRubyDocument('sig { returns(String) }');
    clearCache(doc.uri);
    const first = getCachedSigBlocks(doc);
    clearCache(doc.uri);
    const second = getCachedSigBlocks(doc);
    assert.notStrictEqual(first, second);
  });
});
