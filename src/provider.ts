'use strict';

import * as vscode from 'vscode';

class CompileProgress
{
    private _progress : number;
    public filename : string;
    public job : Promise<CompileResult>;

    public onProgressChange: vscode.EventEmitter<CompileProgress>;

    get progress() : number {
        return this._progress;
    }
    set progress(value: number) {
        this._progress = value;
        this.onProgressChange.fire(this);
    }

    constructor(filename: string) {
        this.filename = filename;
        this.onProgressChange = new vscode.EventEmitter<CompileProgress>();
    }

    toHtml() : string {
        return `Compiling (${(this._progress * 100).toFixed(0)}%) ${this.filename}...`;
    }
}

class CompileResult
{
    public filename : string;
    public output : string;

    constructor(filename: string, output: string) {
        this.filename = filename;
        this.output = output;
    }

    public toHtml() : string {
        return this.output;
    }
}

type CompileValue = CompileProgress | CompileResult;

export default class Provider implements vscode.TextDocumentContentProvider//, vscode.DocumentLinkProvider
{
    static scheme = 'references';
    static asmUri = vscode.Uri.parse("rtcompiler://authority/rtcompiler");

    private _editorDecoration = vscode.window.createTextEditorDecorationType(
        { textDecoration: 'underline' });

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();


    private _sources : Map<string, CompileValue> = new Map();


    get onDidChange() : vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    recompile(filename: string, token?: vscode.CancellationToken)
        : CompileProgress
    {
        let progress = new CompileProgress(filename);

        progress.onProgressChange.event((e: CompileProgress) => {
            this.update(Provider.asmUri);
        }, this);

        progress.job = new Promise<CompileResult>((resolve, reject) =>
        {
            let data = new CompileResult(filename, "ASM for " + filename);

            var duration = 20000;
            var end = new Date().getTime() + duration;

            var i = 10;

            var timy = function()
            {
                progress.progress = 1 - i / 10.0;

                if (i != 0) {
                    i--;
                    setTimeout(timy.bind(this), 1000);
                }
                else
                {
                    this._sources.set(filename, data);
                    resolve(data);
                }
            };
            setTimeout(timy.bind(this), 1000);
        });
        this._sources.set(filename, progress);
        return progress;
    }

    invalidate(filename: string)
    {
        this._sources.delete(filename);
    }

    dispose()
    {
        this._editorDecoration.dispose();
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken)
        : vscode.ProviderResult<string>
    {
        if (vscode.window.activeTextEditor === undefined) {
            return "";
        }
        const filename = vscode.window.activeTextEditor.document.fileName;

        if (this._sources.has(filename)) {
            return this._sources.get(filename).toHtml();
        }
        else
        {
            var progress = this.recompile(filename, token);

            progress.job.then((e: CompileResult) => {
                this.update(Provider.asmUri);
            });
            return progress.toHtml();
        }
    }
}
