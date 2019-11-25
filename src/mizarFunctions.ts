import * as vscode from 'vscode';
import * as path from 'path';
import { makeDisplayProgress,MAX_OUTPUT } from './displayProgress';
import { countLines } from './countLines';
import { displayErrorLinks } from './displayErrors';

const carrier = require('carrier');
const Makeenv = "makeenv";

export const mizfiles = process.env.MIZFILES;

/**
 * @fn
 * fileNameで与えられたファイルに対して、makeenv,commandを実行し、"success","makeenv error","command error"
 * のいずれかを返す関数
 * @brief makeenv,commandを実行する関数
 * @param (channel) 結果を出力するチャンネル
 * @param (fileName) makeenv,commandが実行する対象のファイル名
 * @param (command) 実行するコマンド、デフォルトでは"verifier"となっている
 * @return コマンドの実行結果を,"success","makeenv error", "command error"で返す
 */
export async function mizar_verify(
    channel:vscode.OutputChannel, 
    fileName:string, 
    command:string="verifier"
):Promise<string>
{
    // コマンドを絶対パスにしている
    command = path.join(String(mizfiles) ,command);
    let makeenv = path.join(String(mizfiles),Makeenv);
    // 拡張子を確認し、mizarファイルでなければエラーを示して終了
    if (path.extname(fileName) !== '.miz'){
        vscode.window.showErrorMessage('Not currently in .miz file!!');
        return "file error";
    }
    channel.clear();
    channel.show();
    const displayProgress = makeDisplayProgress();
    // makeenvの実行
    let makeenvProcess = require('child_process').spawn(makeenv,[fileName]);
    let isMakeenvSuccess = true;
    let isCommandSuccess = true;
    carrier.carry(makeenvProcess.stdout, (line:string) => {
        channel.appendLine(line);
        if (line.indexOf('*') !== -1){
            isMakeenvSuccess = false;
        }
    });
    // 非同期処理から実行結果を得るため、Promiseを利用している
    let result:Promise<string> = new Promise((resolve) => {
        makeenvProcess.on('close', () => {
            if(!isMakeenvSuccess){
                resolve('makeenv error');
                return;
            }
            channel.appendLine("Running " + path.basename(command) 
                                + " on " + fileName + '\n');
            channel.appendLine("   Start |------------------------------------------------->| End");
            let [numberOfEnvironmentalLines,
                numberOfArticleLines] = countLines(fileName);
            let numberOfProgress:number = 0;
            let numberOfErrors:number = 0;
            let commandProcess = require('child_process').spawn(command,[fileName]);
            carrier.carry(commandProcess.stdout, (line:string) => {
                // lineを渡してプログレスバーを表示する関数を呼び出す
                [numberOfProgress,numberOfErrors] = displayProgress(channel,line,
                    numberOfArticleLines,numberOfEnvironmentalLines);
                if(line.indexOf('*') !== -1){
                    isCommandSuccess = false;
                }
            }, null, /\r/);
            commandProcess.on('close',() => {
                // 最後の項目のプログレスバーがMAX_OUTPUT未満であれば、足りない分を補完
                let appendChunk = "#".repeat(MAX_OUTPUT-numberOfProgress);
                channel.append(appendChunk);
                // エラーがあれば、その数を出力
                if(numberOfErrors){
                    channel.append(" *" + numberOfErrors);
                }
                channel.appendLine("\n\nEnd.\n");
                if (!isCommandSuccess){
                    resolve('command error');
                }
                else{
                    resolve('success');
                }
            });
        });
    });
    return await result;
}

export function postProcessing(
    channel:vscode.OutputChannel,
    fileName:string,
    uri:vscode.Uri,
    result:string,
    diagnostics:vscode.Diagnostic[],
    diagnosticCollection:vscode.DiagnosticCollection
)
{
    switch(result){
        case "success": break;
        case "makeenv error":
        case "command error":
            displayErrorLinks(channel,fileName,uri,diagnostics,diagnosticCollection);
    }
}
