import * as vscode from 'vscode';
import { mizar_verify } from './mizarFunctions';

export function activate(context: vscode.ExtensionContext) {

    //verifierの実行結果を出力するチャンネル
    var channel = vscode.window.createOutputChannel('output');
    channel.show();

    let disposable1 = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    let disposable2 = vscode.commands.registerCommand('mizar-verify', () => {
        //アクティブなエディタがなければエラーを示して終了
        if (vscode.window.activeTextEditor === undefined){
            vscode.window.showErrorMessage('Not currently in .miz file!!');
            return;
        }

        //アクティブなファイルのパスを取得
        let fileName = vscode.window.activeTextEditor.document.fileName;

        //makeenvとverifierの実行
        mizar_verify(channel,fileName);
    });

    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {}
