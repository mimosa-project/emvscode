import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/** 
 * text内のn番目のkeywordのインデックスを返す関数
 * @param text 検索されるテキスト全文
 * @param keyword 検索するキーワード
 * @param n n番目を指定する変数
 * @return n番目のキーワードのインデックス、見つからなければ-1を返す
 */ 
function getNthKeywordIndex(text:string,keyword:RegExp,n:number){
    let absoluteIndex = -1;
    for (let i = 0; i < n; i++){
        let deltaIndex = text.search(keyword);
        if (deltaIndex !== -1){
            absoluteIndex +=  deltaIndex + 1;
            text = text.slice(deltaIndex+1);
        }
        else{
            return -1;
        }
    }
    return absoluteIndex;
}
/**
 * 開いているテキスト内のホバーの情報を抽出して返す関数
 * @param document ホバーしているドキュメント（ファイル）
 * @param wordRange ホバー対象のワードの範囲
 * @param position ホバーしているマウスカーソルのポジション
 * @return 抽出したホバー情報
 */
function returnHover(
    document:vscode.TextDocument,
    wordRange:vscode.Range
){
    let hoverInformation:Promise<vscode.Hover> = new Promise(
    (resolve,reject) => {
        let startIndex = 0,endIndex = 0;
        let hoveredWord = document.getText(wordRange);
        fs.readFile(document.fileName,'utf8',(err,referenceText) => {
            if(err){
                reject(err);
            }
            // definitionを参照する場合
            if(hoveredWord.search(/Def/) > -1){
                startIndex = getNthKeywordIndex(
                    referenceText,
                    /definition( |\r\n)/, 
                    Number(hoveredWord.slice('Def'.length))
                );
                endIndex = startIndex 
                        + referenceText.slice(startIndex).search(/\nend;/g)
                        + '\nend;'.length;
            }
            // theoremを参照する場合
            else if(hoveredWord.search(/Th/) > -1){
                startIndex = getNthKeywordIndex(
                    referenceText, 
                    /theorem( |\r\n)/, 
                    Number(hoveredWord.slice('Th'.length))
                );
                endIndex = startIndex 
                        + referenceText.slice(startIndex).search(/(\nproof|;)/g)
                        + '\n'.length;
            }
            // ラベルを参照する場合
            else{
                // ホバーしている行までの文字数を取得
                let number = getNthKeywordIndex(
                    referenceText,
                    /\r\n/, 
                    wordRange.start.line
                );
                // 直前のラベルの定義元の位置を取得
                startIndex = referenceText.lastIndexOf(
                    hoveredWord.replace(/( |,)/, '')+':', 
                    number
                );
                endIndex = startIndex 
                        + referenceText.slice(startIndex).search(/;/)
                        + ';'.length;
            }
            let markedString = {
                language:"Mizar", 
                value: referenceText.slice(startIndex,endIndex)
            };
            resolve(new vscode.Hover(markedString, wordRange));
        });
    });
    return hoverInformation;
}

/**
 * Mizarの外部のファイルの定義・定理・スキームのホバー情報を抽出して返す関数
 * @param document ホバーしているドキュメント（ファイル）
 * @param wordRange ホバー対象のワードの範囲
 * @return 抽出したホバー情報
 */
function returnMMLHover(
    document:vscode.TextDocument,
    wordRange:vscode.Range
):Promise<vscode.Hover>
{
    if(process.env.MIZFILES === undefined){
        vscode.window.showErrorMessage('error!');
        return new Promise((resolve,reject) => {
            reject(
                new Error('You have to set environment variable "MIZFILES"')
            );
        });
    }
    let mmlPath = path.join(process.env.MIZFILES,'abstr');

    let hoverInformation:Promise<vscode.Hover> = new Promise ( (resolve, reject)=> {
        let startIndex = 0,endIndex = 0;
        let hoveredWord = document.getText(wordRange);
        let [fileName, referenceWord] = hoveredWord.split(':');
        // .absのファイルを参照する
        fileName = path.join(mmlPath,fileName.toLowerCase() + '.abs');
        fs.readFile(fileName,'utf8', (err,referenceText) => {
            if(err){
                reject(err);
            }
            // hoveredWordは.absファイルで一意のキーになるため、インデックスを取得する
            let wordIndex = referenceText.indexOf(hoveredWord);
            // definitionを参照する場合
            if (/def \d/.test(referenceWord)){
                startIndex = referenceText.lastIndexOf(
                    'definition', 
                    wordIndex
                );
                endIndex = wordIndex + referenceText.slice(wordIndex).search(/;/)
                            + ';'.length;
            }
            // schemeを参照する場合
            else if(/sch \d/.test(referenceWord)){
                startIndex = referenceText.lastIndexOf(
                    'scheme',
                    wordIndex
                );
                endIndex = wordIndex + referenceText.slice(wordIndex).search(
                    /(^|(?<=(\r\n|\n)))($|(?=(\r\n|\n)))/
                );
            }
            // theoremを参照する場合
            else{
                startIndex = referenceText.lastIndexOf(
                    'theorem',
                    wordIndex
                );
                endIndex = wordIndex + referenceText.slice(wordIndex).search(/;/)
                            + ';'.length;
            }
            let markedString = {
                language:"Mizar", 
                value: referenceText.slice(startIndex,endIndex)
            };
            resolve(new vscode.Hover(markedString, wordRange));
        });
    });
    return hoverInformation;
}

/**
 * ホバーを提供するクラス
 * @constructor
 * @param 
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
        // 自身のファイル内の定義、定理、ラベルを参照する場合
        // 「Def10」「Th1」「 A1」「,A2」等を正規表現で取得する
        if (wordRange = document.getWordRangeAtPosition(
                        position,/(Def\d+|Th\d+|( |,)(A|Lm)\d+)/) ){
            return returnHover(document, wordRange);
        }
        // 外部ファイル（MML）の定義、定理、スキームを参照する場合
        // 「FUNCT_2:def 1」「FINSUB_1:13」「XBOOLE_0:sch 1」等を正規表現で取得する
        else if (wordRange = document.getWordRangeAtPosition(
                            position,/(\w+:def \d+|\w+:\d+|\w+:sch \d+)/) ){
            return returnMMLHover(document,wordRange);
        }
        // ホバー対象のキーワードでない場合
        else{
            return;
        } 
    }
}
