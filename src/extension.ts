import * as vscode from 'vscode';
import { mizar_verify } from './mizarFunctions';
import { makeQueryFunction } from './mizarMessages';
import { displayErrorLinks } from './displayErrors';

export const queryMizarMsg = makeQueryFunction();

export function activate(context: vscode.ExtensionContext) {

    //verifierの実行結果を出力するチャンネル
    var channel = vscode.window.createOutputChannel('output');
    channel.show();

    let diagnosticCollection = vscode.languages.createDiagnosticCollection('mizar');
    let diagnostics:vscode.Diagnostic[] = [];

    let disposable1 = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    //mizar-verifyの処理
    let disposable2 = vscode.commands.registerCommand('mizar-verify', async () => {
        
        //アクティブなエディタがなければエラーを示して終了
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }

        diagnostics = [];
        diagnosticCollection.clear();

        //アクティブなファイルのパスを取得
        let uri = vscode.window.activeTextEditor.document.uri;
        let fileName =vscode.window.activeTextEditor.document.fileName;

        //makeenvとverifierの実行
        let result = await mizar_verify(channel,fileName);

        //verifierの結果でエラーがあれば、エラー表示関数を呼び出す
        switch(result){
            case "success": break;
            case "makeenv error": 
            case "verifier error": 
                displayErrorLinks(channel,fileName,uri,diagnostics,diagnosticCollection);
        }
    });

    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {}
