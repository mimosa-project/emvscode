import * as fs from 'fs'
import { MIZFILES } from './mizarFunctions'
import * as path from 'path'

export function makeQueryFunction () {
  const errNo2Msg:{ [n: number]: string } = {}
  function _queryMizarMsg (_errNo:number) {
    if (!Object.keys(errNo2Msg).length) {
      let key = 0
      let isReadingErrorMsg = false
      const MizarMessage = '' + fs.readFileSync(path.join(String(MIZFILES), 'mizar.msg'))
      // OSによって改行コードが違うため，正規表現を利用
      const MizarMessageList = MizarMessage.split(/\r\n|[\n\r]/)

      // mizar.msgの中身(一部)
      // # 243
      // This correctness condition is not allowed in a redefinition with assumptions
      // # 250
      // "$1",...,"$10" are only allowed inside the definiens of a private constructor
      // # 251
      // "it" is only allowed inside the definiens of a public functor or mode

      for (const line of MizarMessageList) {
        // 読み込んだ1行から「# 数字」を抽出する
        const match = line.match(/# (\d+)/)
        if (match) {
          // 「# 数字」の次の行はエラーメッセージであるため、trueを設定
          isReadingErrorMsg = true
          key = Number(match[1])
        } else if (isReadingErrorMsg) {
          errNo2Msg[key] = line
          isReadingErrorMsg = false
        }
      }
    }
    return errNo2Msg[_errNo]
  }
  return _queryMizarMsg
}
