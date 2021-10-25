import * as vscode from 'vscode';
import * as path from 'path';
import { calculateProgressDiff, MAX_OUTPUT } from './calculateProgress';
import { countLines } from './countLines';
import * as cp from 'child_process';
// NOTE: 「import * as from 'carrier';」と記述すると，
// なぜかモジュールが存在しない旨のエラーが出る
const carrier = require('carrier');
const Makeenv = "makeenv";
export const Abstr = "abstr";
export const mizfiles = process.env.MIZFILES;

/**
 * @fn
 * 項目を横並びにするために文字列の後にスペースを追加する関数
 * 指定文字数までスペースを追加する
 * @param str スペースを追加する文字列
 * @param num 何文字までスペースを追加するかを指定する数
 * @return num文字までスペースを追加した文字列
 */
 function padSpace(str:string, num:number=9){
    let padding = " ";
    return str + padding.repeat(num-str.length);
}

/**
 * @fn
 * プログレスバーの足りない「#」を追加する関数
 * エラーがあれば，その数もプログレスバーの横にappendされる
 * @param channel 出力先のチャンネル
 * @param numberOfProgress プログレス数（「#」の数）
 * @param numberOfErrors エラー数，プログレス横に出力される
 */
function addMissingHashTags(
    channel:vscode.OutputChannel, 
    numberOfProgress:number, 
    numberOfErrors:number)
{
    if (MAX_OUTPUT < numberOfProgress){
        return;
    }
    let appendChunk = "#".repeat(MAX_OUTPUT-numberOfProgress);
    channel.append(appendChunk);
    // エラーがあれば、その数を出力
    if (numberOfErrors){
        channel.append(" *" + numberOfErrors);
    }
    channel.appendLine("");    
}

/**
 * @fn
 * fileNameで与えられたファイルに対して，makeenvとcommandを実行する関数
 * @brief makeenv,commandを実行する関数
 * @param channel 結果を出力するチャンネル
 * @param fileName makeenv,commandが実行する対象のファイル名
 * @param command 実行するコマンド、デフォルトでは"verifier"となっている
 * @return コマンドの実行結果を,"success","makeenv error", "command error"で返す
 */
export async function mizar_verify(
    channel:vscode.OutputChannel, 
    fileName:string, 
    command:string="verifier",
    runningCmd: {process: cp.ChildProcess | null}
):Promise<string>
{
    // Mac,LinuxではMizarコマンドのディレクトリにパスが通っていることを前提とする
    let makeenv = Makeenv;
    // 出力している「#」の数を保存する変数
    let numberOfProgress:number = 0;
    // mizarが出力したエラーの数を保持する変数
    let numberOfErrors:number = 0;
    // Parser,MSM,Analyzer等のコマンドから取得した項目をpushするリスト
    // 出力から得た項目(Parser,MSM等)が「コマンドを実行してから初めて得た項目なのか」を判定するために利用する
    let phases:string[] = [];
    if (process.platform === 'win32'){
        command = path.join(String(mizfiles), command);
        makeenv = path.join(String(mizfiles), makeenv);
    }
    // makeenvの実行
    let makeenvProcess = require('child_process').spawn(makeenv,[fileName]);
    runningCmd['process'] = makeenvProcess;
    let isMakeenvSuccess = true;
    let isCommandSuccess = true;
    carrier.carry(makeenvProcess.stdout, (line:string) => {
        // -Vocabularies
        // -Vocabularies  [ 22]
        // -Requirements
        // -Requirements  [ 34]
        // 上記のような記述は出力しないようにする
        if (!/^-/.test(line)){
            channel.appendLine(line);
        }
        if (line.indexOf('*') !== -1){
            isMakeenvSuccess = false;
        }
    });
    // 非同期処理から実行結果を得るため，Promiseを利用している
    // NOTE: 非同期実装の理由はコマンドの出力結果を逐一取得し，そのプログレスを表示するため
    let result:Promise<string> = new Promise((resolve) => {
        makeenvProcess.on('close', () => {
            runningCmd['process'] = null;
            if (!isMakeenvSuccess){
                resolve('makeenv error');
                return;
            }
            channel.appendLine("Running " + path.basename(command)
                                + " on " + fileName + '\n');
            channel.appendLine("   Start |------------------------------------------------->| End");
            let [numberOfEnvironmentalLines, numberOfArticleLines] 
                                                    = countLines(fileName);
            let errorMsg = "\n**** Some errors detected.";
            let commandProcess = require('child_process').spawn(command,[fileName]);
            // 実行中のプロセスを保存
            // NOTE:ユーザが実行を中断する時に必要になる
            runningCmd['process'] = commandProcess;
            carrier.carry(commandProcess.stdout, (line:string) => {
                // コマンドが出力するテキストに「*」が1つでもあれば，エラーとなる
                // NOTE:コマンドによっては「**** One irrelevant 'theorems' directive detected.」
                //      のようなメッセージだけで「*」が出力される場合があるため，最優先でチェックする
                if (line.indexOf('*') !== -1){
                    isCommandSuccess = false;
                }
                // REVIEW:正規表現が正しいか確認
                // Parser   [3482 *2] などを正規表現として抜き出し，
                // 「Parser」や「3482」「2」にあたる部分をグループ化している
                let cmdOutput = line.match(/^(\w+) +\[ *(\d+) *\**(\d*)\].*$/);
                if (cmdOutput === null){
                    return;
                }
                let phase = cmdOutput[1];
                let numberOfParsedLines = Number(cmdOutput[2]);
                numberOfErrors = Number(cmdOutput[3]);
                // Parser -> MSMに切り替わる時など，初めての項目で実行される
                if (phases.indexOf(phase) === -1){
                    if (phases.length !== 0){
                        // 直前の項目の#がMAX_OUTPUT未満であれば，足りない分の「#」を追加
                        addMissingHashTags(channel, numberOfProgress, numberOfErrors);
                    }
                    // 出力の項目を横並びにするために，スペースを補完する
                    channel.append(padSpace(phase) +':');
                    // OutputChannelに追加した項目として，phasesにpush
                    phases.push(phase);
                    // 新しい項目なので，プログレスを初期化する
                    numberOfProgress = 0;
                }
                // 進捗の差（「#」の数）を計算
                let progressDiff = calculateProgressDiff(
                                        numberOfArticleLines, 
                                        numberOfEnvironmentalLines, 
                                        numberOfParsedLines,
                                        numberOfProgress);
                let appendChunk = "#".repeat(progressDiff);
                channel.append(appendChunk);
                numberOfProgress += progressDiff;
                // Mizarコマンドが以下のようなエラーを出力すれば，errorMsgを更新
                // エラーの例：「**** One irrelevant 'theorems' directive detected.」
                let matched = line.match(/\*\*\*\*\s.+/);
                if (matched){
                    errorMsg = "\n" + matched[0];
                }
            }, null, /\r/);
            commandProcess.on('close', (code: number, signal: string) => {
                runningCmd['process'] = null;
                // ユーザがコマンドを中断した場合はクリア
                if (signal === 'SIGINT'){
                    channel.clear();
                }
                else{
                    // プログレスバーがMAX_OUTPUT未満であれば，足りない分の補完とエラー数の追加
                    addMissingHashTags(channel, numberOfProgress, numberOfErrors);
                    if (isCommandSuccess){
                        // エラーがないことが確定するため，errorMsgを空にする
                        errorMsg = "";
                        resolve('success');
                    }
                    else{
                        resolve('command error');
                    }
                    channel.appendLine("\nEnd.");
                    channel.appendLine(errorMsg);
                }
            });
        });
    });
    return result;
}
