import * as vscode from 'vscode';

/**
 * @fn
 * 項目を横並びにするために文字列の後にスペースを追加する関数
 * 指定文字数までスペースを追加する
 * @param (str) スペースを追加する文字列
 * @param (num) 何文字までスペースを追加するかを指定する数
 * @return num文字までスペースを追加した文字列
 */
function padSpace(str:string, num:number=9){
    let padding = str;
    for (let i = 0; i < num - str.length; i++){
        padding = padding + " ";
    }
    return padding;
}

/**
 * @fn
 * 進度を示す関数を返す関数。
 * 項目を保存するためのitems[]、出力した数を保存するためのnumberOfOutputを保持
 * @brief 進度を示す関数を返す関数
 */
export function makeDisplayProgress(){
    // 出力している#の数を保存する変数
    let numberOfOutput:number = 0;
    // 出力から得た項目(Parser,MSM等)が「コマンドを実行してから初めて得た項目なのか」を判定するために使うリスト
    // コマンドの実行ごとに空リストから始まり、Parser,MSM,Analyzer等の取得した項目をpushする
    let items:string[] = [];

    /**
     * @fn
     * プログラムの出力を受け取り、その進度を示す関数
     * @param (channel) 出力するためのチャンネル
     * @param (line) プログラムが出力した1行
     * @param (numberOfArticleLines) mizarのarticle部の行数
     * @param (numberOfBeginLine) mizarのarticle部が始まる前の行番号
     */
    function _displayProgress(
        channel:vscode.OutputChannel,
        line:string,
        numberOfArticleLines:number,
        numberOfBeginLine:number
    ):number
    {
        // REVIEW:正規表現が正しいか確認
        // Parser   [3482] などを正規表現として抜き出し、
        // 「Parser」や「3482」にあたる部分をグループ化している
        let matched = line.match(/^(\w+) +\[ *(\d+) *\**\d*\].*$/);
        if(matched === null){
            return numberOfOutput;
        }
        // 実行して初めて得た項目であった時の前処理
        if (items.indexOf(matched[1],0) === -1){
            if(items.length !== 0){
                // 直前の項目の#が50未満であれば、足りない分を#で補完
                for (let i = 0; i < 50 - numberOfOutput; i++){
                    channel.append("#");
                }
                channel.appendLine("");
            }
            // 出力の項目を横並びにするために、スペースを補完する
            let item = padSpace(matched[1]);
            channel.append(item +':');
            // 前処理を終えた項目として、itemsにpush
            items.push(matched[1]);
            numberOfOutput = 0;
        }
        // 現在の進度と、出力のバーの差を計算する
        let progress = (Number(matched[2]) - numberOfBeginLine) 
                        / numberOfArticleLines * 50 - numberOfOutput;
        // 「現在の進度-出力している進度」の差を埋める出力処理
        for (let i = 0; i < Math.floor(progress); i++){
            if (numberOfOutput >= 50){
                break;
            }
            channel.append("#");
            numberOfOutput += 1;
        }
        return numberOfOutput;
    }
    return _displayProgress;
}
