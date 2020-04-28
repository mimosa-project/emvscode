import * as vscode from 'vscode';
import * as path from 'path';

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
    let startIndex:number = 0;
    let endIndex:number = 0;

    // definitionを参照する場合
    if(/Def/.test(hoveredWord)){
        startIndex = getNthKeywordIndex(
            documentText,
            /definition( |\r\n)/, 
            Number(hoveredWord.slice('Def'.length))
        );
        endIndex = startIndex 
                + documentText.slice(startIndex).search(/\nend;/g)
                + '\nend;'.length;
    }
    // theoremを参照する場合
    else if(/Th/.test(hoveredWord)){
        startIndex = getNthKeywordIndex(
            documentText, 
            /theorem( |\r\n)/, 
            Number(hoveredWord.slice('Th'.length))
        );
        endIndex = startIndex 
                + documentText.slice(startIndex).search(/(\nproof|;)/g)
                + '\n'.length;
    }
    // ラベルを参照する場合
    else{
        // ホバーしている行までの文字数を取得
        let number = document.offsetAt(wordRange.start);
        // 直前のラベルの定義元の位置を取得
        startIndex = documentText.lastIndexOf(
            hoveredWord.replace(/( |,)/, '')+':', 
            number
        );
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
                endIndex = wordIndex + documentText.slice(wordIndex).search(/;/)
                            + ';'.length;
            }
            // schemeを参照する場合
            else if(/sch \d/.test(referenceWord)){
                startIndex = documentText.lastIndexOf(
                    'scheme',
                    wordIndex
                );
                endIndex = wordIndex + documentText.slice(wordIndex).search(
                    // 以下は改行のみの行を取得する正規表現
                    /(^|(?<=(\r\n|\n)))($|(?=(\r\n|\n)))/
                );
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
