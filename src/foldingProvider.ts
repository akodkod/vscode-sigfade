import * as vscode from 'vscode';
import { findSigBlocks } from './sigBlockFinder';

/**
 * FoldingRangeProvider for Sorbet sig blocks.
 * Allows sig blocks to be folded/collapsed in the editor.
 */
export class SigBlockFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    _context: vscode.FoldingContext,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.FoldingRange[]> {
    // Check if folding is enabled
    const config = vscode.workspace.getConfiguration('sigfade');
    const mode = config.get<string>('mode', 'fade');
    if (mode !== 'fold' && mode !== 'both') {
      return [];
    }

    const sigBlocks = findSigBlocks(document);
    const foldingRanges: vscode.FoldingRange[] = [];

    for (const block of sigBlocks) {
      // Only create folding range for multi-line blocks
      if (block.startLine !== block.endLine) {
        foldingRanges.push(
          new vscode.FoldingRange(
            block.startLine,
            block.endLine,
            vscode.FoldingRangeKind.Region
          )
        );
      }
    }

    return foldingRanges;
  }
}

/**
 * Fold all sig blocks in the active editor.
 */
export async function foldAllSigBlocks(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'ruby') {
    return;
  }

  const sigBlocks = findSigBlocks(editor.document);
  const linesToFold = sigBlocks
    .filter((block) => block.startLine !== block.endLine)
    .map((block) => block.startLine);

  if (linesToFold.length === 0) {
    return;
  }

  // Fold each sig block
  for (const line of linesToFold) {
    // Move cursor to the line and fold
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    await vscode.commands.executeCommand('editor.fold', {
      selectionLines: [line],
    });
  }

  // Restore cursor to original position
  const originalPosition = editor.selection.active;
  editor.selection = new vscode.Selection(originalPosition, originalPosition);
}

/**
 * Unfold all sig blocks in the active editor.
 */
export async function unfoldAllSigBlocks(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'ruby') {
    return;
  }

  const sigBlocks = findSigBlocks(editor.document);
  const linesToUnfold = sigBlocks
    .filter((block) => block.startLine !== block.endLine)
    .map((block) => block.startLine);

  if (linesToUnfold.length === 0) {
    return;
  }

  // Unfold each sig block
  for (const line of linesToUnfold) {
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    await vscode.commands.executeCommand('editor.unfold', {
      selectionLines: [line],
    });
  }
}

/**
 * Auto-fold sig blocks if the setting is enabled.
 */
export async function autoFoldOnOpen(document: vscode.TextDocument): Promise<void> {
  const config = vscode.workspace.getConfiguration('sigfade');
  const autoFold = config.get<boolean>('autoFoldOnOpen', false);
  const mode = config.get<string>('mode', 'fade');

  if (!autoFold || (mode !== 'fold' && mode !== 'both')) {
    return;
  }

  if (document.languageId !== 'ruby') {
    return;
  }

  // Small delay to ensure the editor is fully loaded
  await new Promise((resolve) => setTimeout(resolve, 100));
  await foldAllSigBlocks();
}
