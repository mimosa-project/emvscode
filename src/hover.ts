import * as vscode from 'vscode';
import * as path from 'path';

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
):vscode.Hover
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
                + documentText.slice(startIndex).search(/\nend;/g)
                + '\nend;'.length;
    }
    // 定理を参照する場合
    else if ( (startIndex = documentText.indexOf(theoremPattern)) > -1 ){
        endIndex = startIndex 
                + documentText.slice(startIndex).search(/(\nproof|;)/g)
                + '\n'.length;
    }
    // ラベルを参照する場合
    else if ( (startIndex = documentText.lastIndexOf(labelPattern, 
                                        document.offsetAt(wordRange.start))) > -1 )
    {
        endIndex = startIndex 
                + documentText.slice(startIndex).search(/;/)
                + ';'.length;
    }
    let markedString = {
        language:"Mizar", 
        value: documentText.slice(startIndex,endIndex)
    };
    return new vscode.Hover(markedString, wordRange);
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
    if(process.env.MIZFILES === undefined){
        vscode.window.showErrorMessage('error!');
        return new Promise((resolve,reject) => {
            reject(
                new Error('You have to set environment variable "MIZFILES"')
            );
        });
    }
    let mmlPath = path.join(process.env.MIZFILES,'abstr');

    let hoverInformation:Promise<vscode.Hover> = new Promise 
    ((resolve, reject)=> {
        let hoveredWord = document.getText(wordRange);
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
                endIndex = wordIndex + documentText.slice(wordIndex).search(/end;/)
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
            let markedString = {
                language:"Mizar", 
                value: documentText.slice(startIndex,endIndex)
            };
            resolve(new vscode.Hover(markedString, wordRange));
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
                /(by\s+(\w+(,|\s|;|:)*)+|(from\s\w+(:sch \d)*\((\w+,*)+\)))/))
        {
            wordRange = document.getWordRangeAtPosition(position,/\w+/);
            if (!wordRange || document.getText(wordRange) === 'by'){
                return;
            }
            return returnHover(document, wordRange);
        }
        // ホバー対象のキーワードでない場合
        else{
            return;
        }
    }
}
