import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

function indexOfNumber(allText:string,search:string,number:number){
    var index = -1;
    for(let i = 0; i < number; i++){
        index = allText.indexOf(search,index+1);
    }
    return index;
}

function returnExternalFileHover(word:string, wordRange:vscode.Range, fileName:string, numberOfreference:string){
    try{
        let start = 0,end = 0;
        // TODO:非同期へ修正
        let textOfReference = "" + fs.readFileSync(fileName);

        // 場合に応じて、それぞれ参照箇所を抽出する

        // definitionを参照する場合
        if(word.indexOf('def') >= 0){
            start = indexOfNumber(textOfReference, 'definition', Number(numberOfreference.slice('def '.length))+1);
            end = start + textOfReference.slice(start).search(/\nend;/g) + '\nend;'.length;
        }
        // schemeを参照する場合
        else if(word.indexOf('sch') >= 0){
            start = indexOfNumber(textOfReference, 'scheme', Number(numberOfreference.slice('sch '.length))+1);
            end = start + textOfReference.slice(start).search(/\nend;/g) + '\nend;'.length;
        }
        // theoremを参照する場合
        else{
            start = indexOfNumber(textOfReference, 'theorem', Number(numberOfreference)+1);
            end = start + textOfReference.slice(start).search(/(\nproof|;)/g) + '\n'.length;
        }

        let markedString = {language:"Mizar", value: textOfReference.slice(start,end)};
        let hover = new vscode.Hover(markedString, wordRange);
        return hover;
    }catch(e){
        console.log(e);
        vscode.window.showErrorMessage("Can't open " + fileName + '!!!');
        return;
    }
}

function returnInternalFileHover(word:string, wordRange:vscode.Range, fileName:string, position:vscode.Position){
    let start = 0,end = 0;
    // TODO:非同期へ修正
    let textOfReference = "" + fs.readFileSync(fileName);
    try{
        // definitionを参照する場合
        if(word.indexOf('Def') >= 0){
            // TODO:+1の修正、見直し
            start = indexOfNumber(textOfReference, 'definition', Number(word.slice('Def'.length))+1);
            end = start + textOfReference.slice(start).search(/\nend;/g) + '\nend;'.length;
        }
        // theoremを参照する場合
        else if(word.indexOf('Th') >= 0){
            start = indexOfNumber(textOfReference, 'theorem', Number(word.slice('Th'.length))+1);
            end = start + textOfReference.slice(start).search(/(\nproof|;)/g) + '\n'.length;
        }
        // ラベルを参照する場合
        else{
            // ホバー中の現在の行までの文字数を取得
            let number = indexOfNumber(textOfReference,'\n', position.line);
            // 直前のラベルの定義元の位置を取得
            start = textOfReference.lastIndexOf(word+':', number);
            end = start + textOfReference.slice(start).indexOf('\n');
            
        }

        let markedString = {language:"Mizar", value: textOfReference.slice(start,end)};
        let hover = new vscode.Hover(markedString, wordRange);
        return hover;

    }catch(e){
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

        if(process.env.MIZFILES === undefined){
            vscode.window.showErrorMessage('error!');
            return;
        }

        // ホバーの範囲を正規表現により取得
        let wordRange = document.getWordRangeAtPosition(position,/(\w+:def \d+|\w+:sch \d+|\w+:\d+)/);
        let word = document.getText(wordRange);

        // 現在開いているファイルの定義、定理を参照する場合
        if(wordRange === undefined){
            let fileName = document.fileName;
            let wordRange = document.getWordRangeAtPosition(position,/(Def\d+|Th\d+|A\d+)/);
            let word = document.getText(wordRange);
            if (wordRange === undefined){
                return;
            }
            let hover = returnInternalFileHover(word, wordRange, fileName, position);
            return hover;
        }
        // 外部ファイル（MML）の定義、定理、スキームを参照する場合
        else{
            let mmlPath = path.join(process.env.MIZFILES,'mml');
            let [fileName, numberOfreference] = word.split(':');
            fileName = path.join(mmlPath,fileName.toLowerCase() + '.miz');
            // 外部ファイルから適切なホバー情報を取得する
            let hover = returnExternalFileHover(word, wordRange, fileName, numberOfreference);
            return hover;
        }
    }
}
