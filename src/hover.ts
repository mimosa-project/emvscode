import * as vscode from 'vscode';
import * as path from 'path';
import { mizfiles } from './mizarFunctions';
import { Abstr } from './mizarFunctions';

/**
 * 同ファイル内のホバーの情報を抽出して返す関数
 * @param document ホバーしているドキュメント（ファイル）
 * @param wordRange ホバー対象のワードの範囲
 * @param position ホバーしているマウスカーソルのポジション
 * @return 抽出したホバー情報
 */
function returnHover(
    document:vscode.TextDocument,
    wordRange:vscode.Range
):vscode.Hover | undefined
{
    let documentText = document.getText();
    let hoveredWord = document.getText(wordRange);
    // ホバーによって示されるテキストの開始・終了インデックスを格納する変数
    let startIndex:number = -1;
    let endIndex:number = -1;
    // 定義・定理・ラベルの参照する箇所のパターンをそれぞれ格納
    let definitionPattern = ":" + hoveredWord + ":";
    let theoremPattern = "theorem " + hoveredWord + ":";
    let labelPattern = hoveredWord + ":";

    // 定義を参照する場合
    if ( (startIndex = documentText.indexOf(definitionPattern)) > -1 ){
        startIndex = documentText.lastIndexOf('definition', startIndex);
        endIndex = startIndex
                + documentText.slice(startIndex).search(/\send\s*;/g)
                + '\nend;'.length;
    }
    // 定理を参照する場合
    else if ( (startIndex = documentText.indexOf(theoremPattern)) > -1 ){
        endIndex = startIndex 
                + documentText.slice(startIndex).search(/(\sproof|;)/g)
                + '\n'.length;
    }
    // ラベルを参照する場合
    else if ( (startIndex = documentText.lastIndexOf(labelPattern, 
                                    document.offsetAt(wordRange.start)-1)) > -1)
    {
        endIndex = startIndex 
                + documentText.slice(startIndex).search(/;/)
                + ';'.length;
    }
    // ホバーができない場合
    else{
        return;
    }
    let markdownString = new vscode.MarkdownString();
    markdownString.appendCodeblock(
        documentText.slice(startIndex,endIndex), 'mizar');
    return new vscode.Hover(markdownString, wordRange);
}

/**
 * 外部のファイルの定義・定理・スキームのホバー情報を抽出して返す関数
 * @param document ホバーしているドキュメント（ファイル）
 * @param wordRange ホバー対象のワードの範囲
 * @return 抽出したホバー情報
 */
function returnMMLHover(
    document:vscode.TextDocument,
    wordRange:vscode.Range
):Promise<vscode.Hover>
{
    if(mizfiles === undefined){
        vscode.window.showErrorMessage('error!');
        return new Promise((resolve,reject) => {
            reject(
                new Error('You have to set environment variable "MIZFILES"')
            );
        });
    }
    let mmlPath = path.join(mizfiles,Abstr);

    let hoverInformation:Promise<vscode.Hover> = new Promise 
    ((resolve, reject)=> {
        // 改行やスペースがある場合は置き換える
        let hoveredWord = document.getText(wordRange).replace(/\r\n/, "");
        hoveredWord = hoveredWord.replace(/:\s+/,":");
        let [fileName, referenceWord] = hoveredWord.split(':');
        // .absのファイルを参照する
        fileName = path.join(mmlPath,fileName.toLowerCase() + '.abs');
        vscode.workspace.openTextDocument(fileName)
        .then((document) => {
            let documentText = document.getText();
            // ホバーによって示されるテキストの開始・終了インデックスを格納する変数
            let startIndex:number = 0;
            let endIndex:number = 0;

            // hoveredWordは.absファイルで一意のキーになるため、インデックスを取得する
            let wordIndex = documentText.indexOf(hoveredWord);
            // definitionを参照する場合
            if (/def \d/.test(referenceWord)){
                startIndex = documentText.lastIndexOf(
                    'definition', 
                    wordIndex
                );
                endIndex = wordIndex + documentText.slice(wordIndex).search(/\send\s*;/)
                            + 'end;'.length;
            }
            // schemeを参照する場合
            else if(/sch \d/.test(referenceWord)){
                startIndex = documentText.lastIndexOf(
                    'scheme',
                    wordIndex
                );
                endIndex = wordIndex + documentText.slice(wordIndex).search(/;/);
            }
            // theoremを参照する場合
            else{
                startIndex = documentText.lastIndexOf(
                    'theorem',
                    wordIndex
                );
                endIndex = wordIndex + documentText.slice(wordIndex).search(/;/)
                            + ';'.length;
            }
            let markdownString = new vscode.MarkdownString();
            markdownString.appendCodeblock(
                documentText.slice(startIndex,endIndex), 'mizar');
            resolve(new vscode.Hover(markdownString, wordRange));
        },() => {
            reject();
        });
    });
    return hoverInformation;
}

/**
 * ホバーを提供するクラス
 * @constructor
 */
export class HoverProvider implements vscode.HoverProvider{
    /**
     * ユーザがホバーするたびに呼び出されるメソッド
     * @param document マウスでホバーしているドキュメント
     * @param position ホバーしているマウスのポジション
     * @return ホバークラスのインスタンスを返す
     */
    public provideHover(
        document:vscode.TextDocument,
        position: vscode.Position
    ):vscode.ProviderResult<vscode.Hover>{
        let wordRange:vscode.Range | undefined;
        // 外部ファイル（MML）の定義、定理、スキームを参照する場合
        // 「FUNCT_2:def 1」「FINSUB_1:13」「XBOOLE_0:sch 1」等を正規表現で取得する
        if (wordRange = document.getWordRangeAtPosition(
                        position,/(\w+:def \d+|\w+:\d+|\w+:sch \d+)/))
        {
            return returnMMLHover(document,wordRange);
        }
        // 自身のファイル内の定義、定理、ラベルを参照する場合
        // 一度，「by~」「from~」どちらかの形であるかどうかのチェックを行う
        // 例：「by A1,A2」「from IndXSeq(A12,A1)」「from NAT_1:sch 2(A5,A6)」
        else if (wordRange = document.getWordRangeAtPosition(position,
            /(by\s+(\w+(,|\s|:)*)+|(from\s+\w+(:sch\s+\d+)+\s*\((\w+,*)+\)))/))
        {
            wordRange = document.getWordRangeAtPosition(position,/\w+/);
            if (!wordRange || document.getText(wordRange) === 'by'){
                return;
            }
            return returnHover(document, wordRange);
        }

        // 以降はfromの途中で改行されている場合の処理
        let previousLine = document.lineAt(position.line - 1);
        let currentLine = document.lineAt(position.line);
        let nextLine = document.lineAt(position.line + 1);
        let nearText = previousLine.text + "\r\n" 
                        + currentLine.text + "\r\n" + nextLine.text;

        // 「from ~」の形でなければホバー対象でないためリターン
        let matched = nearText.match(/from\s+(\w+(:\s*sch\s+\d+)*)/);
        if (matched === null){
            return;
        }
        // previousLineよりも以前のテキストの文字数を格納する
        let offset = 
            document.offsetAt(new vscode.Position(position.line-1, 0)) - 1;

        // 以下のような記述でスキーム(XFAMILY:sch 1)をホバーで参照する場合の処理
        //from XFAMILY:
        //  sch 1;
        let index = nearText.search(/\w+:\s*sch\s+\d+/);
        // index,offsetともに0から始まるインデックスなので1を加算
        let startIndex = index + offset + 1;
        let endIndex = startIndex + matched[1].length;
        let cursorIndex = document.offsetAt(position);
        // マウスカーソルがホバー対象の範囲内にあり、パターンに一致した表現がある場合
        if (startIndex <= cursorIndex && cursorIndex <= endIndex && index !== -1){
            let pos1 = document.positionAt(startIndex);
            let pos2 = document.positionAt(endIndex);
            let range = new vscode.Range(pos1, pos2);
            return returnMMLHover(document, range);
        }

        // 以下のような記述でラベル(A2,A3,A1等)をホバーで参照する場合の処理
        // from RedInd(A2,
        //  A3,A1);
        let relativeIndex = 
                nearText.search(/from\s+\w+(:\s*sch\s+\d+)*\s*\(\s*(\w+,*\s*)+\)/);
        let absoluteIndex = offset + relativeIndex + 1;
        wordRange = document.getWordRangeAtPosition(position,/[a-zA-Z_]\w*/);
        // ホバーが不要の場合
        if (relativeIndex === -1 || wordRange === undefined 
                || document.offsetAt(position) < absoluteIndex){
            return;
        }
        return returnHover(document, wordRange);
    }
}
