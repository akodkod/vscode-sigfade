import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import {
  SigBlockFoldingProvider,
  foldAllSigBlocks,
  unfoldAllSigBlocks,
  autoFoldOnOpen,
} from './foldingProvider';
import { clearCache } from './sigBlockFinder';

let decorationManager: DecorationManager | undefined;

export function activate(context: vscode.ExtensionContext): void {
  console.log('Sigfade extension is now active');

  // Initialize decoration manager
  decorationManager = new DecorationManager();

  // Register folding provider for Ruby files
  const foldingProvider = new SigBlockFoldingProvider();
  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider(
      { language: 'ruby', scheme: 'file' },
      foldingProvider
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('sigfade.foldAllSigs', foldAllSigBlocks)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sigfade.unfoldAllSigs', unfoldAllSigBlocks)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sigfade.toggleMode', toggleMode)
  );

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
      if (event.affectsConfiguration('sigfade') && decorationManager) {
        decorationManager.updateOpacity();
        decorationManager.updateAllEditors();
      }
    })
  );

  // Listen for document open to auto-fold if enabled
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      autoFoldOnOpen(document);
    })
  );

  // Auto-fold already open Ruby files if setting is enabled
  for (const editor of vscode.window.visibleTextEditors) {
    if (editor.document.languageId === 'ruby') {
      autoFoldOnOpen(editor.document);
    }
  }
}

async function toggleMode(): Promise<void> {
  const config = vscode.workspace.getConfiguration('sigfade');
  const currentMode = config.get<string>('mode', 'fade');

  const modes = ['fade', 'fold', 'both'];
  const currentIndex = modes.indexOf(currentMode);
  const nextMode = modes[(currentIndex + 1) % modes.length];

  await config.update('mode', nextMode, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`Sigfade mode: ${nextMode}`);
}

export function deactivate(): void {
  decorationManager?.dispose();
  decorationManager = undefined;
}
