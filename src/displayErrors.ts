import * as vscode from 'vscode';
import * as fs from "fs";
import * as readline from "readline";
import * as path from 'path';
import { queryMizarMsg } from './extension';

/**
 * @brief 問題パネルへ1つのメッセージを追加する関数
 * @param (errorLine) 何行目にエラーを示すのかを指定する引数
 * @param (errorColumn) 何文字目にエラーを示すのかを指定する引数
 * @param (errorNumber) どの種類のエラーなのかを指定する引数
 * @param (uri) エラーファイルのURI
 * @param (diagnostics) 診断情報リスト
 * @param (diagnosticCollection) VSCodeの問題パネルとなるオブジェクト
 */
export function pushDiagnostic(
    errorLine:number, 
    errorColumn:number, 
    errorNumber:number, 
    uri:vscode.Uri,
    diagnostics:vscode.Diagnostic[],
    diagnosticCollection:vscode.DiagnosticCollection
    )
{
    let errorPosition = new vscode.Position(errorLine-1, errorColumn-1);
    let errorRange = new vscode.Range(errorPosition, errorPosition);
    let diagnostic = new vscode.Diagnostic(errorRange, queryMizarMsg(errorNumber));
    diagnostics.push(diagnostic);
    diagnosticCollection.set(uri, diagnostics);
}

/**
 * @brief 出力チャンネルにクリックできるエラーリンクを表示する関数
 * @param (channel) 出力するためのチャンネル
 * @param (fileName) verifierを実行したmizarのファイル名
 * @param (uri) verifierを実行したmizarファイルのURI
 * @param (diagnostics) 診断情報を詰め込むためのリスト
 * @param (diagnosticCollection) diagnosticsをセットするための引数
 */
export function displayErrorLinks(
    channel:vscode.OutputChannel, 
    fileName:string, 
    uri:vscode.Uri, 
    diagnosticCollection:vscode.DiagnosticCollection
    )
{
    let directory = path.dirname(fileName);
    //拡張子を除いたファイル名だけを取得
    let name = path.basename(fileName, path.extname(fileName));
    //.errファイルを1行ずつ読み込むための準備
    let errFile = path.join(directory,name+".err");
    let stream = fs.createReadStream(errFile, "utf-8");
    let reader = readline.createInterface({ input:stream });
    let diagnostics:vscode.Diagnostic[] = [];

    //.errファイルの例：
    // 左から順に「エラーの行」「左からの文字数」「エラーの種類」を表す番号となっている
    //test.err : 36 1 201
    //           88 29 144

    //.errファイルを1行ずつ読み込み、lineに格納
    reader.on("line", (line:string) => {
        let [errorLine, errorColumn, errorNumber] = line.split(' ');
        pushDiagnostic(Number(errorLine), Number(errorColumn),
                        Number(errorNumber), uri, diagnostics, diagnosticCollection);
        // OSによってファイルのハイパーリンクの形式が変わるため分岐
        if (process.platform === 'win32'){
            channel.appendLine(
                "*" + errorNumber + " : " + queryMizarMsg(Number(errorNumber)) 
                + " : " + "file:///" + fileName + "#" + errorLine);
        }
        // REVIEW:Linux(Ubuntu)では動作確認済み，Macでは未確認
        else{
            channel.appendLine(
                "*" + errorNumber + " : " + queryMizarMsg(Number(errorNumber)) 
                + " : " + fileName + ":" + errorLine);
        }
    });
}
