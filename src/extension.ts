import * as vscode from 'vscode';
import * as path from 'path';
import { mizar_verify, mizfiles, postProcessing } from './mizarFunctions';
import { makeQueryFunction } from './mizarMessages';

export const queryMizarMsg = makeQueryFunction();

export function activate(context: vscode.ExtensionContext) {
    // verifierの実行結果を出力するチャンネル
    var channel = vscode.window.createOutputChannel('output');
    channel.show();
    let diagnosticCollection = vscode.languages.createDiagnosticCollection('mizar');
    let diagnostics:vscode.Diagnostic[] = [];

    let disposable1 = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    // mizar-verifyの処理
    let disposable2 = vscode.commands.registerCommand('mizar-verify', async () => {
        // アクティブなエディタがなければエラーを示して終了
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }
        diagnostics = [];
        diagnosticCollection.clear();
        // アクティブなファイルのパスを取得
        let uri = vscode.window.activeTextEditor.document.uri;
        let fileName =vscode.window.activeTextEditor.document.fileName;
        // makeenvとverifierの実行
        let result = await mizar_verify(channel,fileName);
        // makeenv,verifierの結果でエラーがあれば、エラー表示関数を呼び出す処理
        postProcessing(channel,fileName,uri,result,diagnostics,diagnosticCollection);
    });
 
    // mizar-verify2の実行
    let disposable3 = vscode.commands.registerCommand('mizar-verify2', async () => {
        //アクティブなエディタがなければエラーを示して終了
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }
        diagnostics = [];
        diagnosticCollection.clear();
        // アクティブなファイルのパスを取得
        let fileName = vscode.window.activeTextEditor.document.fileName;
        // errflag.exeの絶対パスを格納
        let errFlag = path.join(String(mizfiles),"errflag");
        // makeenvとverifierの実行
        await mizar_verify(channel,fileName);
        // errflag.exeの実行(テキスト内にエラーのフラグを書き込む)
        require('child_process').spawn(errFlag,[fileName]);
    });

    let disposable4 = vscode.commands.registerCommand('mizar-irrths', async () => {
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }
        let fileName = vscode.window.activeTextEditor.document.fileName;
        let uri = vscode.window.activeTextEditor.document.uri;
        diagnostics = [];
        diagnosticCollection.clear();
        let result = await mizar_verify(channel,fileName,"irrths");
        // makeenv,irrthsの結果でエラーがあれば、エラー表示関数を呼び出す処理
        postProcessing(channel,fileName,uri,result,diagnostics,diagnosticCollection);
    });

    let disposable5 = vscode.commands.registerCommand('mizar-relinfer', async () => {
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }
        let fileName = vscode.window.activeTextEditor.document.fileName;
        let uri = vscode.window.activeTextEditor.document.uri;
        diagnostics = [];
        diagnosticCollection.clear();
        let result = await mizar_verify(channel,fileName,"relinfer");
        // makeenv,relinferの結果でエラーがあれば、エラー表示関数を呼び出す処理
        postProcessing(channel,fileName,uri,result,diagnostics,diagnosticCollection);
    });

    let disposable6 = vscode.commands.registerCommand('mizar-trivdemo', async () => {
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }
        let fileName = vscode.window.activeTextEditor.document.fileName;
        let uri = vscode.window.activeTextEditor.document.uri;
        diagnostics = [];
        diagnosticCollection.clear();
        let result = await mizar_verify(channel,fileName,"trivdemo");
        // makeenv,trivdemoの結果でエラーがあれば、エラー表示関数を呼び出す処理
        postProcessing(channel,fileName,uri,result,diagnostics,diagnosticCollection);
    });

    let disposable7 = vscode.commands.registerCommand('mizar-reliters', async () => {
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }
        let fileName = vscode.window.activeTextEditor.document.fileName;
        let uri = vscode.window.activeTextEditor.document.uri;
        diagnostics = [];
        diagnosticCollection.clear();
        let result = await mizar_verify(channel,fileName,"reliters");
        // makeenv,relitersの結果でエラーがあれば、エラー表示関数を呼び出す処理
        postProcessing(channel,fileName,uri,result,diagnostics,diagnosticCollection);
    });

    let disposable8 = vscode.commands.registerCommand('mizar-relprem', async () => {
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }
        let fileName = vscode.window.activeTextEditor.document.fileName;
        let uri = vscode.window.activeTextEditor.document.uri;
        diagnostics = [];
        diagnosticCollection.clear();
        let result = await mizar_verify(channel,fileName,"relprem");
        // makeenv,relpremの結果でエラーがあれば、エラー表示関数を呼び出す処理
        postProcessing(channel,fileName,uri,result,diagnostics,diagnosticCollection);
    });

    let disposable9 = vscode.commands.registerCommand('mizar-irrvoc', async () => {
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }
        let fileName = vscode.window.activeTextEditor.document.fileName;
        let uri = vscode.window.activeTextEditor.document.uri;
        diagnostics = [];
        diagnosticCollection.clear();
        let result = await mizar_verify(channel,fileName,"irrvoc");
        // makeenv,irrvocの結果でエラーがあれば、エラー表示関数を呼び出す処理
        postProcessing(channel,fileName,uri,result,diagnostics,diagnosticCollection);
    });

    let disposable10 = vscode.commands.registerCommand('mizar-inacc', async () => {
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }
        let fileName = vscode.window.activeTextEditor.document.fileName;
        let uri = vscode.window.activeTextEditor.document.uri;
        diagnostics = [];
        diagnosticCollection.clear();
        let result = await mizar_verify(channel,fileName,"inacc");
        // makeenv,inaccの結果でエラーがあれば、エラー表示関数を呼び出す処理
        postProcessing(channel,fileName,uri,result,diagnostics,diagnosticCollection);
    });

    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
    context.subscriptions.push(disposable4);
    context.subscriptions.push(disposable5);
    context.subscriptions.push(disposable6);    
    context.subscriptions.push(disposable7);
    context.subscriptions.push(disposable8);
    context.subscriptions.push(disposable9);
    context.subscriptions.push(disposable10);
}

// this method is called when your extension is deactivated
export function deactivate() {}
