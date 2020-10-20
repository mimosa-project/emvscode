import * as vscode from 'vscode';
import * as path from 'path';
import { Abstr } from './mizarFunctions';

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
    // 定義・定理・ラベルの参照する箇所のパターンをそれぞれ格納
    let definitionPattern = ":" + selectedWord + ":";
    let theoremPattern = "theorem " + selectedWord + ":";
    let labelPattern = selectedWord + ":";

    // 定義を参照する場合
    if( (startIndex = documentText.indexOf(definitionPattern)) > -1){
        endIndex = startIndex + definitionPattern.length;
    }
    // 定理を参照する場合
    else if( (startIndex = documentText.indexOf(theoremPattern)) > -1){
        endIndex = startIndex + theoremPattern.length;
    }
    // ラベルを参照する場合
    else if ((startIndex = documentText.lastIndexOf(labelPattern, 
            document.offsetAt(wordRange.start)-1)) > -1){
        endIndex = startIndex + labelPattern.length;
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
    let absDir = path.join(process.env.MIZFILES, Abstr);
    let definition:Promise<vscode.Definition> = new Promise
    ((resolve, reject) => {
        let selectedWord = document.getText(wordRange);
        let [fileName] = selectedWord.split(':');
        // .absのファイルを絶対パスで格納
        fileName = path.join(absDir,fileName.toLowerCase() + '.abs');
        // 定義を参照するドキュメントを開き，定義箇所を指定して返す
        vscode.workspace.openTextDocument(fileName).then((document) => {
            let referenceText = document.getText();
            let index = referenceText.indexOf(selectedWord);
            let pos1 = document.positionAt(index);
            let pos2 = document.positionAt(index + selectedWord.length);
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
        if (wordRange = document.getWordRangeAtPosition(
            position,/(\w+:def\s+\d+|\w+:\s*\d+|\w+:sch\s+\d+)/))
        {
            return returnMMLDefinition(document,wordRange);
        }
        // 自身のファイル内の定義、定理、ラベルを参照する場合
        // 例：「by A1,A2;」「from IndXSeq(A12,A1);」「from NAT_1:sch 2(A5,A6)」
        // by A1,A2;
        else if (document.getWordRangeAtPosition(position,
            /(by\s+(\w+(,|\s|:)*)+|from\s+\w+(:sch\s+\d+)*\((\w+,*)+\))/))
        {
            wordRange = document.getWordRangeAtPosition(position,/\w+/);
            if (!wordRange || document.getText(wordRange) === 'by'){
                return;
            }
            return returnDefinition(document, wordRange);
        }
        else{
            return;
        }
    }
}