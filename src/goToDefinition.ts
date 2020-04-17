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

function returnDefinition(
    document:vscode.TextDocument,
    wordRange:vscode.Range
):vscode.Definition{
    let allText = document.getText();
    let word = document.getText(wordRange);
    let startIndex : number = 0;
    let endIndex : number = 0;

    if(word.search(/Def/) > -1){
        startIndex = getNthKeywordIndex(
            allText,
            /definition( |\r\n)/, 
            Number(word.slice('Def'.length))
        );
        endIndex = startIndex + 'definition'.length;
    }
    else if(word.search(/Th/) > -1){
        startIndex = getNthKeywordIndex(
            allText,
            /theorem( |\r\n)/, 
            Number(word.slice('Th'.length))
        );
        endIndex = startIndex + 'theorem'.length;
    }
    else{
        let number = getNthKeywordIndex(
            allText,
            /\r\n/, 
            wordRange.start.line
        );
        // 直前のラベルの定義元の位置を取得
        startIndex = allText.lastIndexOf(
            word.replace(/( |,)/, '')+':', 
            number
        );
        endIndex = startIndex + word.length;
    }

    let definitionRange:vscode.Range = new vscode.Range(document.positionAt(startIndex),document.positionAt(endIndex));
    let definition = new vscode.Location(document.uri,definitionRange);
    return definition;
}

function returnMMLDefinition(
    document:vscode.TextDocument,
    wordRange:vscode.Range
):Promise<vscode.Definition|vscode.DefinitionLink[]>
{
    if(process.env.MIZFILES === undefined){
        vscode.window.showErrorMessage('error!');
        return new Promise((resolve,reject) => {
            reject(
                new Error('You have to set environment variable "MIZFILES"')
            );
        });
    }
    // TODO:変数名の修正、コードの整形
    let mmlPath = path.join(process.env.MIZFILES,'abstr');
    let definition:Promise<vscode.Definition|vscode.DefinitionLink[]> = new Promise( (resolve, reject) => {
        let word = document.getText(wordRange);
        let [fileName, referenceWord] = word.split(':');
        // .absのファイルを参照する
        fileName = path.join(mmlPath,fileName.toLowerCase() + '.abs');
        // 定義を参照するドキュメントを開く
        vscode.workspace.openTextDocument(fileName).then((document) => {
            let referenceText = document.getText();
            let index = referenceText.indexOf(word);
            let pos1 = document.positionAt(index);
            let pos2 = document.positionAt(index + word.length);
            let definitionRange = new vscode.Range(pos1,pos2);
            let definition = new vscode.Location(vscode.Uri.file(fileName),definitionRange);
            resolve(definition);
        });
    });
    return definition;
}

class LocationLink implements vscode.LocationLink{
    targetRange:vscode.Range;
    targetUri:vscode.Uri;
    constructor(range:vscode.Range,uri:vscode.Uri){
        this.targetRange = range;
        this.targetUri = uri;
    }
}

export class DefinitionProvider implements vscode.DefinitionProvider{
    public provideDefinition(
        document:vscode.TextDocument,
        position:vscode.Position,
        token:vscode.CancellationToken
    ):vscode.ProviderResult<vscode.Definition|vscode.DefinitionLink[]>
    {
        let wordRange:vscode.Range | undefined;
        if(wordRange = document.getWordRangeAtPosition(position,/(Def\d+|Th\d+|( |,)(A|Lm)\d+)/)){
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

export class DeclarationProvider implements vscode.DeclarationProvider{
    public provideDeclaration(
        document:vscode.TextDocument,
        position:vscode.Position
    ){

        let wordRange:vscode.Range | undefined;
        if(wordRange = document.getWordRangeAtPosition(position,/(Def\d+|Th\d+|( |,)(A|Lm)\d+)/)){
            return;
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
