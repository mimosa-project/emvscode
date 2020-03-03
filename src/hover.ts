import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// n番目のkeywordの位置を返す関数
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
// TODO:returnMMLHoverと統合しても良さそう
function returnHover(
    document:vscode.TextDocument,
    wordRange:vscode.Range,
    position:vscode.Position
){
    let p:Promise<vscode.Hover> = new Promise((resolve,reject) => {
        let startIndex = 0,endIndex = 0;
        let hoveredWord = document.getText(wordRange);
        fs.readFile(document.fileName,'utf8',(err,referenceText) => {
            if(err){
                reject(err);
            }
            // definitionを参照する場合
            if(hoveredWord.indexOf('Def') > -1){
                // TODO:+1の修正、見直し
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
            else if(hoveredWord.indexOf('Th') > -1){
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
                // ホバー中の行までの文字数を取得
                let number = getNthKeywordIndex(
                    referenceText,
                    /\r\n/, 
                    position.line
                );
                // 直前のラベルの定義元の位置を取得
                startIndex = referenceText.lastIndexOf(
                    hoveredWord.replace(/( |,)/, '')+':', 
                    number
                );
                endIndex = startIndex 
                        + referenceText.slice(startIndex).indexOf('\n');
            }
            let markedString = {
                language:"Mizar", 
                value: referenceText.slice(startIndex,endIndex)
            };
            resolve(new vscode.Hover(markedString, wordRange));
        });
    });
    return p;
}

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
    let mmlPath = path.join(process.env.MIZFILES,'mml');
    let hoveredWord = document.getText(wordRange);
    let [fileName, referenceWord] = hoveredWord.split(':');
    fileName = path.join(mmlPath,fileName.toLowerCase() + '.miz');
    let startIndex = 0,endIndex = 0;

    let p:Promise<vscode.Hover> = new Promise ( (resolve, reject)=> {
        fs.readFile(fileName,'utf8', (err,referenceText) => {
            if(err){
                reject(err);
            }
            // definitionを参照する場合
            if(referenceWord.indexOf('def') > -1){
                startIndex = getNthKeywordIndex(
                    referenceText, 
                    /definition( |\r\n)/, 
                    Number(referenceWord.slice('def '.length))
                );
                endIndex = startIndex 
                    + referenceText.slice(startIndex).search(/\nend;/g) 
                    + '\nend;'.length;
            }
            // schemeを参照する場合
            else if(referenceWord.indexOf('sch') > -1){
                startIndex = getNthKeywordIndex(
                    referenceText, 
                    /scheme( |\r\n)/, 
                    Number(referenceWord.slice('sch '.length))
                );
                endIndex = startIndex 
                    + referenceText.slice(startIndex).search(/\nend;/g) 
                    + '\nend;'.length;
            }
            // theoremを参照する場合
            else{
                startIndex = getNthKeywordIndex(
                    referenceText, 
                    /theorem( |\r\n)/, 
                    Number(referenceWord)
                );
                endIndex = startIndex 
                        + referenceText.slice(startIndex).search(/(\nproof|;)/g)
                        + '\n'.length;
            }
            let markedString = {
                language:"Mizar", 
                value: referenceText.slice(startIndex,endIndex)
            };
            resolve(new vscode.Hover(markedString, wordRange));
        });
    });
    return p;
}

export class HoverProvider implements vscode.HoverProvider{
    // ホバーするたびに呼び出されるメソッド
    public provideHover(
        document:vscode.TextDocument,
        position: vscode.Position,
        token:vscode.CancellationToken
    ):vscode.ProviderResult<vscode.Hover>{
        let wordRange:vscode.Range | undefined;
        // 自身のファイル内の定義、定理、ラベルを参照する場合
        // 「Def10」「Th1」「 A1」「,A2」等を正規表現で取得する
        if (wordRange = document.getWordRangeAtPosition(
                        position,/(Def\d+|Th\d+|( |,)A\d+)/) ){
            return returnHover(document, wordRange, position);
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
