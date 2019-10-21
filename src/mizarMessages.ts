import * as fs from 'fs';
import { mizfiles } from './mizarFunctions';
import * as path from 'path';

export function makeQueryFunction() {

    let errNo2Msg:{ [n: number]: string } = {};

    function _queryMizarMsg(_errNo:number) {

        if (!Object.keys(errNo2Msg).length) {
            
            let key = 0;
            
            // mizar.msgの中身(一部)
            // # 243
            // This correctness condition is not allowed in a redefinition with assumptions
            // # 250
            // "$1",...,"$10" are only allowed inside the definiens of a private constructor
            // # 251
            // "it" is only allowed inside the definiens of a public functor or mode
            
            let MizarMessage = "" + fs.readFileSync(path.join(String(mizfiles),'mizar.msg'));

            let MizarMessageList = MizarMessage.split('\r\n'||'\n');

            for (let line of MizarMessageList) {

                // 読み込んだ1行から「# 数字」を抽出する
                let match = line.match(/# \d+/);

                if (match){
                    // 「#　数字」の「数字」を抽出する 例) 「# 108」 -> 「108」
                    key = Number(match[0].match(/\d+/));
                }
                else{
                    errNo2Msg[key] = line;

                    // mizar.msgの終わりには下記の例のような記述があるが、
                    // このままではerrNo2Msg[1999] = "#"となってしまうため
                    // keyを0にしておく

                    // 例
                    // # 1999
                    // I/O stream error: Access error
                    // #

                    key = 0;
                }
            }
            // errNo2Msg[0]にはゴミが入るため削除
            delete errNo2Msg[0];
        }
        return errNo2Msg[_errNo];
    }
    return _queryMizarMsg;
}
