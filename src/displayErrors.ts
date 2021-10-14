import * as vscode from 'vscode';
import * as fs from "fs";
import * as readline from "readline";
import * as path from 'path';
import { queryMizarMsg } from './extension';

/**
 * @brief Problemsにクリックできるエラーメッセージを追加する関数
 * @param fileName verifierを実行したmizarのファイル名
 * @param uri verifierを実行したmizarファイルのURI
 * @param diagnosticCollection diagnosticsをセットするための引数
 */
export function setDiagnostics(
    fileName:string, 
    uri:vscode.Uri, 
    diagnosticCollection:vscode.DiagnosticCollection)
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
        let [errorLine, errorColumn, errorNumber] 
            = line.split(' ').map(str => parseInt(str, 10));
        let errorPosition = new vscode.Position(errorLine-1, errorColumn-1);
        let errorRange = new vscode.Range(errorPosition, errorPosition);
        let diagnostic = new vscode.Diagnostic(errorRange, queryMizarMsg(errorNumber));
        diagnostics.push(diagnostic);
    }).on('close', () => {
        diagnosticCollection.set(uri, diagnostics);
    });
}
