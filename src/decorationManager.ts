import * as vscode from 'vscode';
import { getCachedSigBlocks, isCursorInSigBlock, SigBlock } from './sigBlockFinder';

export class DecorationManager {
  private decorationType: vscode.TextEditorDecorationType | undefined;
  private opacity: number;
  private debounceTimeout: NodeJS.Timeout | undefined;
  private readonly debounceMs = 150;

  constructor() {
    this.opacity = this.getConfiguredOpacity();
    this.createDecorationType();
  }

  private getConfiguredOpacity(): number {
    const config = vscode.workspace.getConfiguration('sigfade');
    return config.get<number>('opacity', 0.5);
  }

  private createDecorationType(): void {
    // Dispose old decoration type if it exists
    this.decorationType?.dispose();

    this.decorationType = vscode.window.createTextEditorDecorationType({
      opacity: this.opacity.toString(),
    });
  }

  /**
   * Update the opacity setting and recreate the decoration type.
   */
  public updateOpacity(): void {
    const newOpacity = this.getConfiguredOpacity();
    if (newOpacity !== this.opacity) {
      this.opacity = newOpacity;
      this.createDecorationType();
      // Re-apply decorations to all visible editors
      this.updateAllEditors();
    }
  }

  /**
   * Update decorations for a specific editor, optionally with debouncing.
   */
  public updateDecorations(editor: vscode.TextEditor, debounce = true): void {
    if (debounce) {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      this.debounceTimeout = setTimeout(() => {
        this.applyDecorations(editor);
      }, this.debounceMs);
    } else {
      this.applyDecorations(editor);
    }
  }

  private applyDecorations(editor: vscode.TextEditor): void {
    if (!this.decorationType) {
      return;
    }

    const document = editor.document;

    // Only apply to Ruby files
    if (document.languageId !== 'ruby') {
      editor.setDecorations(this.decorationType, []);
      return;
    }

    const sigBlocks = getCachedSigBlocks(document);
    const cursorPosition = editor.selection.active;

    // Filter out sig blocks where cursor is currently located
    const decorationsToApply: vscode.DecorationOptions[] = [];

    for (const sigBlock of sigBlocks) {
      const isCursorInBlock = isCursorInSigBlock(cursorPosition, [sigBlock]);

      if (!isCursorInBlock) {
        decorationsToApply.push({
          range: sigBlock.range,
          hoverMessage: 'Sorbet type signature',
        });
      }
    }

    editor.setDecorations(this.decorationType, decorationsToApply);
  }

  /**
   * Update decorations for all visible Ruby editors.
   */
  public updateAllEditors(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.languageId === 'ruby') {
        this.updateDecorations(editor, false);
      }
    }
  }

  /**
   * Clear all decorations from an editor.
   */
  public clearDecorations(editor: vscode.TextEditor): void {
    if (this.decorationType) {
      editor.setDecorations(this.decorationType, []);
    }
  }

  /**
   * Dispose resources.
   */
  public dispose(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.decorationType?.dispose();
  }
}
