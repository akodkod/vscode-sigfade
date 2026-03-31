import * as vscode from 'vscode';

export async function createRubyDocument(content: string): Promise<vscode.TextDocument> {
  return vscode.workspace.openTextDocument({ content, language: 'ruby' });
}

export async function createPlainTextDocument(content: string): Promise<vscode.TextDocument> {
  return vscode.workspace.openTextDocument({ content, language: 'plaintext' });
}
