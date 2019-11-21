import * as vscode from 'vscode';
// プログレスバーとして出力する「#」の最大数
export const MAX_OUTPUT = 50;

/**
 * @fn
 * 項目を横並びにするために文字列の後にスペースを追加する関数
 * 指定文字数までスペースを追加する
 * @param (str) スペースを追加する文字列
 * @param (num) 何文字までスペースを追加するかを指定する数
 * @return num文字までスペースを追加した文字列
 */
function padSpace(str:string, num:number=9){
    let padding = " ";
    return str + padding.repeat(num-str.length);
}

/**
 * @fn
 * 進度を示す関数を返す関数。
 * 項目を保存するためのitems[]、出力した数を保存するためのnumberOfProgressを保持
 * @brief 進度を示す関数を返す関数
 */
export function makeDisplayProgress(){
    // 出力している#の数を保存する変数
    let numberOfProgress:number = 0;
    // 出力から得た項目(Parser,MSM等)が「コマンドを実行してから初めて得た項目なのか」を判定するために使うリスト
    // コマンドの実行ごとに空リストから始まり、Parser,MSM,Analyzer等の取得した項目をpushする
    let items:string[] = [];
    // mizarが出力したエラーの数を保持する変数
    let storeNumberOfErrors = 0;


    /**
     * @fn
     * プログラムの出力を受け取り、その進度を示す関数
     * @param (channel) 出力するためのチャンネル
     * @param (line) プログラムが出力した1行
     * @param (numberOfArticleLines) mizarの記述部の行数
     * @param (numberOfEnvironmentalLines) mizarの環境部の行数
     */
    function _displayProgress(
        channel:vscode.OutputChannel,
        line:string,
        numberOfArticleLines:number,
        numberOfEnvironmentalLines:number
    ):number[]
    {
        // REVIEW:正規表現が正しいか確認
        // Parser   [3482] などを正規表現として抜き出し、
        // 「Parser」や「3482」にあたる部分をグループ化している
        let matched = line.match(/^(\w+) +\[ *(\d+) *\**(\d*)\].*$/);
        if(matched === null){
            return [numberOfProgress,storeNumberOfErrors];
        }
        // 実行して初めて得た項目であった時の前処理
        if (items.indexOf(matched[1],0) === -1){
            if(items.length !== 0){
                // 直前の項目の#がMAX_OUTPUT未満であれば、足りない分を#で補完
                let appendChunk = "#".repeat(MAX_OUTPUT-numberOfProgress);
                channel.append(appendChunk);
                // エラーがあれば、その数を出力
                if (storeNumberOfErrors){
                    channel.append(" *" + storeNumberOfErrors);
                }
                channel.appendLine("");
            }
            // 出力の項目を横並びにするために、スペースを補完する
            let item = padSpace(matched[1]);
            channel.append(item +':');
            // 前処理を終えた項目として、itemsにpush
            items.push(matched[1]);
            numberOfProgress = 0;
        }
        // 現在の進度と、出力のバーの差を計算する
        let progressDiff = (Number(matched[2]) - numberOfEnvironmentalLines) 
                        / numberOfArticleLines * MAX_OUTPUT - numberOfProgress;
        // 「現在の進度-出力している進度」の差を埋める出力処理
        let appendChunk = "#".repeat(Math.floor(progressDiff));
        channel.append(appendChunk);
        numberOfProgress += Math.floor(progressDiff);
        storeNumberOfErrors = Number(matched[3]);
        return [numberOfProgress,storeNumberOfErrors];
    }
    return _displayProgress;
}
