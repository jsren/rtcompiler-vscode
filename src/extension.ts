'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Provider from './provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const asmUri = vscode.Uri.parse("rtcompiler://authority/rtcompiler");

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "rtcompiler" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('rtcompiler.showAsmView', () => {
        // The code you place here will be executed every time your command is executed
        vscode.commands.executeCommand('vscode.previewHtml', asmUri, vscode.ViewColumn.Two, 'Assembly Preview').then((success) => { }, 
        (reason) => {
            vscode.window.showErrorMessage(reason);
        })
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });

    let reg = vscode.commands.registerTextEditorCommand("rtcompiler.recompile",
        (editor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]) =>
    {
        console.warn("Filename: " + editor.document.uri);
        provider.recompile(editor.document.fileName);
    }, this);

    let provider = new Provider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('rtcompiler', provider);

    vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor) => {
        provider.update(asmUri);
    });

    vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) =>
    {
        provider.invalidate(e.fileName);
        if (e === vscode.window.activeTextEditor.document) {
            provider.update(asmUri);
        }
    });

    context.subscriptions.push(disposable, registration, reg);
}

// this method is called when your extension is deactivated
export function deactivate() {

}
