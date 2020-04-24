import * as vscode from 'vscode';
import * as path from 'path';

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
 * カーソル箇所の単語の定義を返す関数
 * 同ファイル内で定義されているtheorem,definition,ラベル等の定義を返す
 * @param document ユーザが開いているドキュメント
 * @param wordRange カーソルのある箇所の単語範囲
 * @return カーソル箇所の単語の定義
 */
function returnDefinition(
    document:vscode.TextDocument,
    wordRange:vscode.Range
):vscode.Definition
{
    let documentText = document.getText();
    let selectedWord = document.getText(wordRange);
    // 定義箇所のインデックスを格納する変数
    let startIndex:number = 0;
    let endIndex:number = 0;

    if(selectedWord.search(/Def/) > -1){
        startIndex = getNthKeywordIndex(
            documentText,
            /definition( |\r\n)/, 
            Number(selectedWord.slice('Def'.length))
        );
        endIndex = startIndex + 'definition'.length;
    }
    else if(selectedWord.search(/Th/) > -1){
        startIndex = getNthKeywordIndex(
            documentText,
            /theorem( |\r\n)/, 
            Number(selectedWord.slice('Th'.length))
        );
        endIndex = startIndex + 'theorem'.length;
    }
    else{
        let number = getNthKeywordIndex(
            documentText,
            /\r\n/, 
            wordRange.start.line
        );
        // 直前のラベルの定義元の位置を取得
        startIndex = documentText.lastIndexOf(
            selectedWord.replace(/( |,)/, '')+':', 
            number
        );
        endIndex = startIndex + selectedWord.length;
    }

    let definitionRange:vscode.Range = new vscode.Range(
        document.positionAt(startIndex),
        document.positionAt(endIndex)
    );
    let definition = new vscode.Location(document.uri,definitionRange);
    return definition;
}

/**
 * カーソル箇所の単語の定義を返す関数
 * 外部のtheorem,definition等の定義を返す
 * @param document ユーザが開いているドキュメント
 * @param wordRange カーソルのある箇所の単語範囲
 * @return カーソル箇所の単語の定義
 */
function returnMMLDefinition(
    document:vscode.TextDocument,
    wordRange:vscode.Range
):Promise<vscode.Definition>
{
    if(process.env.MIZFILES === undefined){
        vscode.window.showErrorMessage('error!');
        return new Promise((resolve,reject) => {
            reject(
                new Error('You have to set environment variable "MIZFILES"')
            );
        });
    }
    // TODO:変数名の修正，コードの整形
    let mmlPath = path.join(process.env.MIZFILES,'abstr');
    let definition:Promise<vscode.Definition> = new Promise
    ((resolve, reject) => {
        let searchedWord = document.getText(wordRange);
        let [fileName] = searchedWord.split(':');
        // .absのファイルを絶対パスで格納
        fileName = path.join(mmlPath,fileName.toLowerCase() + '.abs');
        // 定義を参照するドキュメントを開き，定義箇所を指定して返す
        vscode.workspace.openTextDocument(fileName).then((document) => {
            let referenceText = document.getText();
            let index = referenceText.indexOf(searchedWord);
            let pos1 = document.positionAt(index);
            let pos2 = document.positionAt(index + searchedWord.length);
            let definitionRange = new vscode.Range(pos1,pos2);
            let definition = new vscode.Location(
                vscode.Uri.file(fileName),
                definitionRange
            );
            resolve(definition);
        },
        // ドキュメントが開けなかった場合，その旨を表示
        () => {
            vscode.window.showErrorMessage('not found ' + fileName);
            reject();
        });
    });
    return definition;
}

export class DefinitionProvider implements vscode.DefinitionProvider
{
    public provideDefinition(
        document:vscode.TextDocument,
        position:vscode.Position,
        token:vscode.CancellationToken
    ):vscode.ProviderResult<vscode.Definition|vscode.DefinitionLink[]>
    {
        let wordRange:vscode.Range | undefined;
        if(wordRange = document.getWordRangeAtPosition(
                        position,/(Def\d+|Th\d+|( |,)(A|Lm)\d+)/) ){
            return returnDefinition(document, wordRange);
        }
        else if(wordRange = document.getWordRangeAtPosition(
                            position,/(\w+:def \d+|\w+:\d+|\w+:sch \d+)/) ){
            return returnMMLDefinition(document, wordRange);
        }
        else{
            return;
        }
    }
}
