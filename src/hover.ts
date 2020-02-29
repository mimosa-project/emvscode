import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
// n番目のsearchStringの位置を返す関数
function getNthKeywordIndex(text:string,keyword:string,n:number){
    var index = -1;
    for(let i = 0; i < n; i++){
        index = text.indexOf(keyword,index+1);
    }
    return index;
}

function returnHover(document:vscode.TextDocument, wordRange:vscode.Range, position:vscode.Position){
    try{
        let startIndex = 0,endIndex = 0;
        // TODO:非同期へ修正

        let referenceText = "" + fs.readFileSync(document.fileName);
        let word = document.getText(wordRange);
        // definitionを参照する場合
        if(word.indexOf('Def') > -1){
            // TODO:+1の修正、見直し
            startIndex = getNthKeywordIndex(referenceText, 'definition', Number(word.slice('Def'.length))+1);
            endIndex = startIndex + referenceText.slice(startIndex).search(/\nend;/g) + '\nend;'.length;
        }
        // theoremを参照する場合
        else if(word.indexOf('Th') > -1){
            startIndex = getNthKeywordIndex(referenceText, 'theorem', Number(word.slice('Th'.length))+1);
            endIndex = startIndex + referenceText.slice(startIndex).search(/(\nproof|;)/g) + '\n'.length;
        }
        // ラベルを参照する場合
        else{
            // ホバー中の現在の行までの文字数を取得
            let number = getNthKeywordIndex(referenceText,'\n', position.line);
            // 直前のラベルの定義元の位置を取得
            startIndex = referenceText.lastIndexOf(word.replace(/( |,)/, '')+':', number);
            endIndex = startIndex + referenceText.slice(startIndex).indexOf('\n');
        }
        let markedString = {language:"Mizar", value: referenceText.slice(startIndex,endIndex)};
        let hover = new vscode.Hover(markedString, wordRange);
        return hover;

    }catch(e){
        return;
    }
}

function returnMMLHover(document:vscode.TextDocument,wordRange:vscode.Range):vscode.ProviderResult<vscode.Hover>{
    if(process.env.MIZFILES === undefined){
        vscode.window.showErrorMessage('error!');
        return;
    }
    try{
        let mmlPath = path.join(process.env.MIZFILES,'mml');
        let word = document.getText(wordRange);
        let [fileName, referenceWord] = word.split(':');
        fileName = path.join(mmlPath,fileName.toLowerCase() + '.miz');
        let startIndex = 0,endIndex = 0;
        // TODO:非同期へ修正
        let referenceText = "" + fs.readFileSync(fileName)
            // definitionを参照する場合
            if(referenceWord.indexOf('def') > -1){
                startIndex = getNthKeywordIndex(referenceText, 'definition', Number(referenceWord.slice('def '.length))+1);
                endIndex = startIndex + referenceText.slice(startIndex).search(/\nend;/g) + '\nend;'.length;
            }
            // schemeを参照する場合
            else if(referenceWord.indexOf('sch') > -1){
                startIndex = getNthKeywordIndex(referenceText, 'scheme', Number(referenceWord.slice('sch '.length))+1);
                endIndex = startIndex + referenceText.slice(startIndex).search(/\nend;/g) + '\nend;'.length;
            }
            // theoremを参照する場合
            else{
                startIndex = getNthKeywordIndex(referenceText, 'theorem', Number(referenceWord)+1);
                endIndex = startIndex + referenceText.slice(startIndex).search(/(\nproof|;)/g) + '\n'.length;
            }
            let markedString = {language:"Mizar", value: referenceText.slice(startIndex,endIndex)};
            let hover = new vscode.Hover(markedString, wordRange);
            return hover;
    }catch(e){
        console.log(e);
        return;
    }
}

export class HoverProvider implements vscode.HoverProvider{
    // ホバーするたびに呼び出されるメソッド
    public provideHover(
        document:vscode.TextDocument,
        position: vscode.Position,
        token:vscode.CancellationToken
    ):vscode.ProviderResult<vscode.Hover>{
        // ホバーの範囲を正規表現により取得
        let wordRange:vscode.Range | undefined;

        // 自身のファイル内の定義、定理、ラベルを参照する場合
        // 「Def10」「Th1」「 A1」「,A2」等を正規表現で取得する
        if (wordRange = document.getWordRangeAtPosition(position,/(Def\d+|Th\d+|( |,)A\d+)/)){
            return returnHover(document, wordRange, position);
        }
        // 外部ファイル（MML）の定義、定理、スキームを参照する場合
        // 「FUNCT_2:def 1」「FINSUB_1:13」「XBOOLE_0:sch 1」等を正規表現で取得する
        else if (wordRange = document.getWordRangeAtPosition(position,/(\w+:def \d+|\w+:\d+|\w+:sch \d+)/)){
            return returnMMLHover(document,wordRange);
        }
        // ホバー対象のキーワードでない場合
        else{
            return;
        }
    }
}
