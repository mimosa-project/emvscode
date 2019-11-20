import * as fs from "fs";

/**
 * @fn
 * mizarファイルの記述部の行数を返す関数
 * スペースや改行だけの行は、それ以降に他の記述がなければカウントされない
 * @param (fileName) 記述部の行数を取得する対象のファイル名
 * @return 記述部の行数
 */
export function countArticleLines(fileName:string):number{
    let count:number = 0;
    let result:number = 0;
    let file = "" + fs.readFileSync(fileName);
    let fileList = file.split('\r\n'||'\n');
    let isArticleArea = false;
    for (let line of fileList){
        if(line.indexOf('begin') !== -1){
            isArticleArea = true;
        }
        if(isArticleArea){
            count += 1;
        }
        if(/\w+/.test(line)){
            result = count;
        }
    }
    return result;
}

/**
 * @fn
 * 環境部の行数を返す関数
 * beginが記述される直前の行数までを返す
 * @param (fileName) 環境部の行数を取得する対象のファイル名
 * @return 環境部の行数
 */
export function countEnvironmentalLines(fileName:string):number{
    let count:number = 0;
    let file = "" + fs.readFileSync(fileName);
    let fileList = file.split('\r\n'||'\n');
    for (let line of fileList){
        if(line.indexOf('begin') !== -1){
            break;
        }
        count++;
    }
    return count;
}
