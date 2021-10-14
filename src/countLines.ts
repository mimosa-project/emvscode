import * as fs from "fs";

/**
 * @fn
 * mizarファイルの環境部・記述部の行数を返す関数
 * スペースや改行だけの行は、それ以降に他の記述がなければカウントされない
 * @param (fileName) 記述部の行数を取得する対象のファイル名
 * @return 環境部・記述部の行数のリスト
 */
export function countLines(fileName:string):number[]{
    let articleCounter:number = 0;
    let environmentalCounter:number = 0;
    let result:number[] = [];
    let file = "" + fs.readFileSync(fileName);
    let lines = file.split(/\r\n|[\n\r]/);
    let isArticleArea = false;
    for (let line of lines){
        // begin以降から記述部が始まるためisArticleAreaにtrueを設定
        // NOTE:コメント内に「begin」が存在しても問題が無いように，正規表現を利用
        if(!/^(::|:::)\s*\w*\s*begin\s*\w*/.test(line)){
            isArticleArea = true;
        }
        // 記述部の行数のカウント
        if(isArticleArea){
            articleCounter++;
        }
        // 環境部の行数のカウント
        else{
            environmentalCounter++;
        }
        // 改行やスペース以外の記述がある行数までを結果に格納する
        // つまりアルファベットや数字が記述されている行で最も大きい行数が返され、
        // それ以降の改行やスペースのみの行はカウントされないことになる
        if(/\w+/.test(line)){
            result = [environmentalCounter,articleCounter];
        }
    }
    return result;
}
