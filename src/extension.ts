import * as vscode from 'vscode';
import * as path from 'path';
import { mizar_verify, mizfiles } from './mizarFunctions';
import { makeQueryFunction } from './mizarMessages';
import { displayErrorLinks } from './displayErrors';

export const queryMizarMsg = makeQueryFunction();

/**
 * @fn
 * コマンドを実行する関数を返す関数
 * @param (channel) 結果を出力するチャンネル
 * @param (diagnostics) 診断情報を詰め込むためのリスト
 * @param (diagnosticCollection) 
 * diagnosticsをセットするための引数、セットにより問題パネルへ表示される
 * @param (command) 実行するコマンドの名前
 * @param (isVerify2) 
 * verify2が実行されたかどうかを受け取る
 * この引数でerrflagを実行するかどうかを決定する
 * @return コマンドを実行する処理の関数
 */
function returnExecutingFunction(
    channel:vscode.OutputChannel, 
    diagnostics:vscode.Diagnostic[], 
    diagnosticCollection:vscode.DiagnosticCollection, 
    command:string,
    isVerify2:boolean=false
)
{    
    return async () => {
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
        // 環境変数MIZFILESが未定義ならエラーメッセージを表示
        if (mizfiles === undefined){
            vscode.window.showErrorMessage('You have to set environment variable "MIZFILES"');
            return;
        }
        // makeenvとverifierの実行
        let result = null;
        let prevCwd = process.cwd();
        try {
            // dict,prelを読み込むため、カレントディレクトリを対象ファイルの1つ上へ変更
            process.chdir(path.join( path.dirname(fileName), '..') );
            result = await mizar_verify(channel,fileName,command);
        } finally {
            process.chdir(prevCwd);
        }
        // mizar-verify2の場合はerrflagを実行する
        if(isVerify2){
            // errflagの実行
            let errFlag = path.join(String(mizfiles),"errflag");
            require('child_process').spawn(errFlag,[fileName]);
            return;
        }
        // makeenv,verifierの結果でエラーがあれば、エラー表示関数を呼び出す処理
        switch(result){
            case "success": break;
            case "makeenv error":
            case "command error":
                displayErrorLinks(
                    channel,fileName,uri,diagnostics,diagnosticCollection
                );
        }
    };
}

export function activate(context: vscode.ExtensionContext) {
    // verifierの実行結果を出力するチャンネル
    let channel = vscode.window.createOutputChannel('output');
    channel.show();
    let diagnosticCollection = 
        vscode.languages.createDiagnosticCollection('mizar');
    let diagnostics:vscode.Diagnostic[] = [];
    // mizar-verifyの処理
    let disposable1 = vscode.commands.registerCommand(
        'mizar-verify', 
        returnExecutingFunction(
            channel,diagnostics,diagnosticCollection,"verifier"
        )
    );
    // mizar-verify2の実行(第5引数でisVerify2をtrueにする)
    let disposable2 = vscode.commands.registerCommand(
        'mizar-verify2', 
        returnExecutingFunction(
            channel,diagnostics,diagnosticCollection,"verifier",true
        )
    );
    let disposable3 = vscode.commands.registerCommand(
        'mizar-irrths', 
        returnExecutingFunction(
            channel,diagnostics,diagnosticCollection,"irrths"
        )
    );
    let disposable4 = vscode.commands.registerCommand(
        'mizar-relinfer', 
        returnExecutingFunction(
            channel,diagnostics,diagnosticCollection,"relinfer"
        )
    );
    let disposable5 = vscode.commands.registerCommand(
        'mizar-trivdemo', 
        returnExecutingFunction(
            channel,diagnostics,diagnosticCollection,"trivdemo"
        )
    );
    let disposable6 = vscode.commands.registerCommand(
        'mizar-reliters', 
        returnExecutingFunction(
            channel,diagnostics,diagnosticCollection,"reliters"
        )
    );
    let disposable7 = vscode.commands.registerCommand(
        'mizar-relprem', 
        returnExecutingFunction(
            channel,diagnostics,diagnosticCollection,"relprem"
        )
    );
    let disposable8 = vscode.commands.registerCommand(
        'mizar-irrvoc', 
        returnExecutingFunction(
            channel,diagnostics,diagnosticCollection,"irrvoc"
        )
    );
    let disposable9 = vscode.commands.registerCommand(
        'mizar-inacc', 
        returnExecutingFunction(
            channel,diagnostics,diagnosticCollection,"inacc"
        )
    );

    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
    context.subscriptions.push(disposable4);
    context.subscriptions.push(disposable5);
    context.subscriptions.push(disposable6);    
    context.subscriptions.push(disposable7);
    context.subscriptions.push(disposable8);
    context.subscriptions.push(disposable9);
}

// this method is called when your extension is deactivated
export function deactivate() {}
