import * as vscode from 'vscode';
import * as path from 'path';
import { makeDisplayProgress,MAX_OUTPUT } from './displayProgress';
import { countLines } from './countLines';

const carrier = require('carrier');
const Makeenv = "makeenv";

export const mizfiles = process.env.MIZFILES;

/**
 * @fn
 * fileNameで与えられたファイルに対して、makeenv,verifierを実行し、"success","makeenv error","verifier error"
 * のいずれかを返す関数
 * @brief makeenv,verifierを実行する関数
 * @param (channel) 結果を出力するチャンネル
 * @param (fileName) makeenv,verifierが実行する対象のファイル名
 * @param (util) 実行するコマンド、デフォルトで"verifier"となっており、現時点では"verifier"以外使っていない
 * @return コマンドの実行結果を,"success","makeenv error", "verifier error"で返す
 */
export async function mizar_verify(
    channel:vscode.OutputChannel, 
    fileName:string, 
    util:string="verifier"
)
{
    //コマンドを絶対パスにしている
    util = path.join(String(mizfiles) ,util);
    let makeenv = path.join(String(mizfiles),Makeenv);
    //拡張子を確認し、mizarファイルでなければエラーを示して終了
    if (path.extname(fileName) !== '.miz'){
        vscode.window.showErrorMessage('Not currently in .miz file!!');
        return;
    }
    channel.clear();
    channel.show();
    const displayProgress = makeDisplayProgress();
    //makeenvの実行
    let makeenvProcess = require('child_process').spawn(makeenv,[fileName]);
    let isMakeenvSuccess = true;
    let isVerifierSuccess = true;
    carrier.carry(makeenvProcess.stdout, (line:string) => {
        channel.appendLine(line);

        if (line.indexOf('*') !== -1){
            isMakeenvSuccess = false;
        }
    });
    //非同期処理から実行結果を得るため、Promiseを利用している
    let result = new Promise((resolve) => {
        makeenvProcess.on('close', () => {
            channel.appendLine("Running " + path.basename(util) 
                                + " on " + fileName + '\n');
            channel.appendLine("   Start |------------------------------------------------->| End");
            if(!isMakeenvSuccess){
                resolve('makeenv error');
                return;
            }
            let [numberOfEnvironmentalLines,
                numberOfArticleLines] = countLines(fileName);
            let numberOfProgress:number = 0;
            let numberOfErrors:number = 0;
            let verifierProcess = require('child_process').spawn(util,[fileName]);
            carrier.carry(verifierProcess.stdout, (line:string) => {
                // lineを渡してプログレスバーを表示する関数を呼び出す
                [numberOfProgress,numberOfErrors] = displayProgress(channel,line,
                    numberOfArticleLines,numberOfEnvironmentalLines);
                if(line.indexOf('*') !== -1){
                    isVerifierSuccess = false;
                }
            }, null, /\r/);
            verifierProcess.on('close',() => {
                // 最後の項目のプログレスバーがMAX_OUTPUT未満であれば、足りない分を補完
                let appendChunk = "#".repeat(MAX_OUTPUT-numberOfProgress);
                channel.append(appendChunk);
                if(numberOfErrors){
                    channel.append(" *" + numberOfErrors);
                }
                channel.appendLine("\n\nEnd.\n");
                if (!isVerifierSuccess){
                    resolve('verifier error');
                }
                else{
                    resolve('success');
                }
            });
        });
    });
    return await result;
}
