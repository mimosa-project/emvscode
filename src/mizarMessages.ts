import * as fs from 'fs';
import { mizfiles } from './mizarFunctions';
import * as path from 'path';
/**
 * エラー番号をエラーメッセージに変換するオブジェクトを保持するクロージャ
 * @return クエリするための関数そのものを返す
 */
export function makeQueryFunction() {
    let errNo2Msg:{ [n: number]: string } = {};
    /**
     * エラー番号からエラーメッセージを得る関数
     * @param _errNo クエリするためのエラー番号
     * @return エラー番号に対応するエラーメッセージ
     */
    function _queryMizarMsg(_errNo:number) {
        if (!Object.keys(errNo2Msg).length) {
            let key:number = 0;
            let isReadingErrorMsg:boolean = false;
            let MizarMessage = "" + fs.readFileSync(path.join(String(mizfiles),'mizar.msg'));
            let MizarMessageList = MizarMessage.split('\r\n'||'\n');

            // mizar.msgの中身(一部)
            // # 243
            // This correctness condition is not allowed in a redefinition with assumptions
            // # 250
            // "$1",...,"$10" are only allowed inside the definiens of a private constructor
            // # 251
            // "it" is only allowed inside the definiens of a public functor or mode
                     
            for (let line of MizarMessageList) {
                // 読み込んだ1行から「# 数字」を抽出する
                let match = line.match(/# (\d+)/);
                if (match){
                    // 「# 数字」の次の行はエラーメッセージであるため、trueを設定
                    isReadingErrorMsg = true;
                    key = Number(match[1]);
                }
                else if(isReadingErrorMsg){
                    errNo2Msg[key] = line;
                    isReadingErrorMsg = false;
                }
            }
        }
        return errNo2Msg[_errNo];
    }
    return _queryMizarMsg;
}
