/* eslint-disable brace-style */
/* eslint-disable no-cond-assign */
import * as vscode from 'vscode'
import * as path from 'path'
import { MIZFILES, ABSTR } from './mizarFunctions'

/**
 * カーソル箇所の単語の定義を返す関数
 * 同ファイル内で定義されているtheorem,definition,ラベル等の定義を返す
 * @param document ユーザが開いているドキュメント
 * @param wordRange カーソルのある箇所の単語範囲
 * @return カーソル箇所の単語の定義
 */
function returnDefinition (
  document:vscode.TextDocument,
  wordRange:vscode.Range
):vscode.Definition {
  const documentText = document.getText()
  const selectedWord = document.getText(wordRange)
  // 定義箇所のインデックスを格納する変数
  let startIndex = 0
  let endIndex = 0
  // 定義・定理・ラベルの参照する箇所のパターンをそれぞれ格納
  const definitionPattern = ':' + selectedWord + ':'
  const theoremPattern = 'theorem ' + selectedWord + ':'
  const labelPattern = selectedWord + ':'

  // 定義を参照する場合
  if ((startIndex = documentText.indexOf(definitionPattern)) > -1) {
    endIndex = startIndex + definitionPattern.length
  } else if ((startIndex = documentText.indexOf(theoremPattern)) > -1) {
    endIndex = startIndex + theoremPattern.length
  } else if ((startIndex = documentText.lastIndexOf(labelPattern,
    document.offsetAt(wordRange.start) - 1)) > -1) {
    endIndex = startIndex + labelPattern.length
  }
  const definitionRange:vscode.Range = new vscode.Range(
    document.positionAt(startIndex),
    document.positionAt(endIndex)
  )
  const definition = new vscode.Location(document.uri, definitionRange)
  return definition
}

/**
 * カーソル箇所の単語の定義を返す関数
 * 外部のtheorem,definition等の定義を返す
 * @param document ユーザが開いているドキュメント
 * @param wordRange カーソルのある箇所の単語範囲
 * @return カーソル箇所の単語の定義
 */
function returnABSDefinition (
  document:vscode.TextDocument,
  wordRange:vscode.Range
):Promise<vscode.Definition> {
  if (MIZFILES === undefined) {
    vscode.window.showErrorMessage('error!')
    return new Promise((resolve, reject) => {
      reject(
        new Error('You have to set environment variable "MIZFILES"')
      )
    })
  }
  const absDir = path.join(MIZFILES, ABSTR)
  const definition:Promise<vscode.Definition> = new Promise(
    (resolve, reject) => {
      const selectedWord = document.getText(wordRange)
      let [fileName] = selectedWord.split(':')
      // .absのファイルを絶対パスで格納
      fileName = path.join(absDir, fileName.toLowerCase() + '.abs')
      // 定義を参照するドキュメントから，定義箇所を指定して返す
      vscode.workspace.openTextDocument(fileName).then((document) => {
        const documentText = document.getText()
        const index = documentText.indexOf(selectedWord)
        const startPosition = document.positionAt(index)
        const endPosition = document.positionAt(index + selectedWord.length)
        const definitionRange = new vscode.Range(startPosition, endPosition)
        const definition = new vscode.Location(
          vscode.Uri.file(fileName),
          definitionRange
        )
        resolve(definition)
      },
      // ドキュメントが開けなかった場合，その旨を表示
      (e) => {
        vscode.window.showErrorMessage('Not found ' + fileName)
        Error('Not found ' + fileName)
      })
    })
  return definition
}

/**
 * 定義元を提供するクラス
 * @constructor
 */
export class DefinitionProvider implements vscode.DefinitionProvider {
  /**
     * ユーザが定義元を参照する際に呼び出されるメソッド
     * @param document 定義元の参照が発生したドキュメント
     * @param position 定義元の参照が発生した際のカーソルのポジション
     * @return 定義元の情報（パスと範囲）を持ったインスタンスを返す
     */
  public provideDefinition (
    document:vscode.TextDocument,
    position:vscode.Position
  ):vscode.ProviderResult<vscode.Definition|vscode.DefinitionLink[]> {
    let wordRange:vscode.Range | undefined
    // 外部の定義や定理，スキームを参照する場合
    // 例：「RELSET_1:8」「ZFMISC_1:def 10」「XBOOLE_0:sch 1」
    if (wordRange = document.getWordRangeAtPosition(
      position, /(\w+:def\s+\d+|\w+\s*:\d+|\w+:sch\s+\d+)/)) {
      return returnABSDefinition(document, wordRange)
    }
    // 自身のファイル内の定義、定理、ラベルを参照する場合
    // 例：「by A1,A2;」「from IndXSeq(A12,A1);」「from NAT_1:sch 2(A5,A6)」
    // by A1,A2;
    else if (document.getWordRangeAtPosition(position,
      /(by\s+(\w+(,|\s|:)*)+|from\s+\w+(:sch\s+\d+)*\((\w+,*)+\))/)) {
      wordRange = document.getWordRangeAtPosition(position, /\w+/)
      if (!wordRange || document.getText(wordRange) === 'by') {
        return
      }
      return returnDefinition(document, wordRange)
    }
  }
}
