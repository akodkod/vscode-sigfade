import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import { clearCache } from './sigBlockFinder';

let decorationManager: DecorationManager | undefined;

export function activate(context: vscode.ExtensionContext): void {
  console.log('Sigfade extension is now active');

  // Initialize decoration manager
  decorationManager = new DecorationManager();

  // Apply decorations to currently active editor
  if (vscode.window.activeTextEditor) {
    decorationManager.updateDecorations(vscode.window.activeTextEditor, false);
  }

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && decorationManager) {
        decorationManager.updateDecorations(editor, false);
      }
    })
  );

  // Listen for cursor/selection changes
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (decorationManager) {
        decorationManager.updateDecorations(event.textEditor, true);
      }
    })
  );

  // Listen for document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      // Clear cache when document changes
      clearCache(event.document.uri);

      // Update decorations for affected editors
      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document === event.document && decorationManager) {
          decorationManager.updateDecorations(editor, true);
        }
      }
    })
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('sigfade')) {
        if (decorationManager) {
          decorationManager.updateOpacity();
          decorationManager.updateAllEditors();
        }
      }
    })
  );
}

export function deactivate(): void {
  decorationManager?.dispose();
  decorationManager = undefined;
}
