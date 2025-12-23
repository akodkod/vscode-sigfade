import * as vscode from 'vscode';

export interface SigBlock {
  range: vscode.Range;
  startLine: number;
  endLine: number;
}

/**
 * Find all Sorbet sig blocks in a document.
 * Supports both single-line `sig { ... }` and multi-line `sig do ... end` formats.
 */
export function findSigBlocks(document: vscode.TextDocument): SigBlock[] {
  const sigBlocks: SigBlock[] = [];
  const lineCount = document.lineCount;

  let inMultiLineSig = false;
  let sigStartLine = -1;
  let sigStartChar = 0;
  let braceDepth = 0;
  let inBraceSig = false;

  for (let lineNum = 0; lineNum < lineCount; lineNum++) {
    const line = document.lineAt(lineNum);
    const text = line.text;

    // Skip empty lines when not in a multi-line sig
    if (!inMultiLineSig && !inBraceSig && text.trim() === '') {
      continue;
    }

    // Check for single-line sig with braces: sig { ... }
    const singleLineMatch = text.match(/^(\s*)sig\s*\{[^}]*\}\s*$/);
    if (singleLineMatch && !inMultiLineSig && !inBraceSig) {
      const startChar = singleLineMatch[1].length;
      const endChar = text.trimEnd().length;
      sigBlocks.push({
        range: new vscode.Range(lineNum, startChar, lineNum, endChar),
        startLine: lineNum,
        endLine: lineNum,
      });
      continue;
    }

    // Check for start of multi-line brace sig: sig {
    const braceStartMatch = text.match(/^(\s*)sig\s*\{\s*$/);
    if (braceStartMatch && !inMultiLineSig && !inBraceSig) {
      inBraceSig = true;
      sigStartLine = lineNum;
      sigStartChar = braceStartMatch[1].length;
      braceDepth = 1;
      continue;
    }

    // Check for inline start of multi-line brace sig: sig { params(...)
    const braceInlineStartMatch = text.match(/^(\s*)sig\s*\{(?![^}]*\}\s*$)/);
    if (braceInlineStartMatch && !inMultiLineSig && !inBraceSig) {
      inBraceSig = true;
      sigStartLine = lineNum;
      sigStartChar = braceInlineStartMatch[1].length;
      // Count braces in this line
      braceDepth = (text.match(/\{/g) || []).length - (text.match(/\}/g) || []).length;
      continue;
    }

    // Track brace depth for multi-line brace sig
    if (inBraceSig) {
      braceDepth += (text.match(/\{/g) || []).length - (text.match(/\}/g) || []).length;
      if (braceDepth <= 0) {
        const endChar = text.trimEnd().length;
        sigBlocks.push({
          range: new vscode.Range(sigStartLine, sigStartChar, lineNum, endChar),
          startLine: sigStartLine,
          endLine: lineNum,
        });
        inBraceSig = false;
        sigStartLine = -1;
        braceDepth = 0;
      }
      continue;
    }

    // Check for start of multi-line do...end sig: sig do
    const doStartMatch = text.match(/^(\s*)sig\s+do\s*$/);
    if (doStartMatch && !inMultiLineSig) {
      inMultiLineSig = true;
      sigStartLine = lineNum;
      sigStartChar = doStartMatch[1].length;
      continue;
    }

    // Check for end of multi-line do...end sig
    if (inMultiLineSig && /^\s*end\s*$/.test(text)) {
      const endChar = text.trimEnd().length;
      sigBlocks.push({
        range: new vscode.Range(sigStartLine, sigStartChar, lineNum, endChar),
        startLine: sigStartLine,
        endLine: lineNum,
      });
      inMultiLineSig = false;
      sigStartLine = -1;
    }
  }

  return sigBlocks;
}

/**
 * Check if a cursor position is inside any of the given sig blocks.
 */
export function isCursorInSigBlock(
  position: vscode.Position,
  sigBlocks: SigBlock[]
): boolean {
  return sigBlocks.some((block) => block.range.contains(position));
}

/**
 * Cache for sig block positions to avoid re-parsing unchanged documents.
 */
const sigBlockCache = new Map<string, { version: number; blocks: SigBlock[] }>();

/**
 * Get sig blocks with caching based on document version.
 */
export function getCachedSigBlocks(document: vscode.TextDocument): SigBlock[] {
  const key = document.uri.toString();
  const cached = sigBlockCache.get(key);

  if (cached && cached.version === document.version) {
    return cached.blocks;
  }

  const blocks = findSigBlocks(document);
  sigBlockCache.set(key, { version: document.version, blocks });
  return blocks;
}

/**
 * Clear cache entry for a document.
 */
export function clearCache(uri: vscode.Uri): void {
  sigBlockCache.delete(uri.toString());
}
