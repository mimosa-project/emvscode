import * as vscode from 'vscode'
import * as path from 'path'
import { mizarVerify, MIZFILES } from './mizarFunctions'
import { makeQueryFunction } from './mizarMessages'
import { setDiagnostics } from './displayErrors'
import { DefinitionProvider } from './goToDefinition'
import { HoverProvider } from './hover'
import * as cp from 'child_process'

export const queryMizarMsg = makeQueryFunction()

/**
 * @fn
 * コマンドを実行する関数を返す関数
 * @param (channel) 結果を出力するチャンネル
 * @param (diagnostics) 診断情報を詰め込むためのリスト
 * @param (diagnosticCollection)
 * diagnosticsをセットするための引数、セットにより問題パネルへ表示される
 * @param (command) 実行するコマンドの名前
 * @param (isVerify2)
 * verify2が実行されたかどうかを受け取る
 * この引数でerrflagを実行するかどうかを決定する
 * @return コマンドを実行する処理の関数
 */
function returnExecutingFunction (
  channel:vscode.OutputChannel,
  runningCmd: {process: cp.ChildProcess | null},
  diagnosticCollection:vscode.DiagnosticCollection,
  command:string
) {
  return async () => {
    // アクティブなエディタがなければエラーを示して終了
    if (vscode.window.activeTextEditor === undefined) {
      vscode.window.showErrorMessage('Not currently in .miz file!!')
      return
    }
    // アクティブなファイルのパスを取得
    const uri = vscode.window.activeTextEditor.document.uri
    const fileName = vscode.window.activeTextEditor.document.fileName
    // 拡張子を確認し、mizarファイルでなければエラーを示して終了
    if (path.extname(fileName) !== '.miz') {
      vscode.window.showErrorMessage('Not currently in .miz file!!')
      return
    }
    // 環境変数MIZFILESが未定義ならエラーメッセージを表示
    if (MIZFILES === undefined) {
      vscode.window.showErrorMessage('You have to set environment variable "MIZFILES"')
      return
    }
    // 既に実行中のコマンドがある場合
    if (runningCmd.process) {
      return
    }
    channel.clear()
    channel.show(true)
    diagnosticCollection.clear()
    // コマンド実行前にファイルを保存
    await vscode.window.activeTextEditor.document.save()
    // makeenvとverifierの実行
    const prevCwd = process.cwd()
    try {
      // dict,prelを読み込むため、カレントディレクトリを対象ファイルの1つ上へ変更
      process.chdir(path.join(path.dirname(fileName), '..'))
      await mizarVerify(channel, fileName, command, runningCmd)
    } finally {
      process.chdir(prevCwd)
    }
    // NOTE:判定ミスは致命的なため「success」と判定された場合でも，
    //      最も確実に判定できる「.err」ファイルをチェックすべき
    setDiagnostics(fileName, uri, diagnosticCollection)
  }
}

interface StrStrDictionary {
    [key: string]: string;
}

const MIZAR_COMMANDS:StrStrDictionary = {
  'mizar-verify': 'verifier',
  'mizar-irrths': 'irrths',
  'mizar-relinfer': 'relinfer',
  'mizar-trivdemo': 'trivdemo',
  'mizar-reliters': 'reliters',
  'mizar-relprem': 'relprem',
  'mizar-irrvoc': 'irrvoc',
  'mizar-inacc': 'inacc',
  'mizar-chklab': 'chklab'
}

export function activate (context: vscode.ExtensionContext) {
  // verifierの実行結果を出力するチャンネル
  const channel = vscode.window.createOutputChannel('Mizar output')
  const runningCmd: {process: cp.ChildProcess | null} = { process: null }
  const diagnosticCollection =
        vscode.languages.createDiagnosticCollection('mizar')
  channel.show(true)

  // Mizarコマンドの登録
  for (const cmd in MIZAR_COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        cmd,
        returnExecutingFunction(
          channel, runningCmd, diagnosticCollection, MIZAR_COMMANDS[cmd]
        )
      )
    )
  }

  const hover = new HoverProvider()
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: 'file', language: 'Mizar' }, hover
    )
  )

  const definition = new DefinitionProvider()
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { scheme: 'file', language: 'Mizar' }, definition
    )
  )

  // Mizarコマンドを停止する処理
  const stopCommand = vscode.commands.registerCommand(
    'stop-command',
    () => {
      if (runningCmd.process === null) {
        return
      }
      runningCmd.process.kill('SIGINT')
      vscode.window.showInformationMessage('Command stopped!')
    }
  )
  context.subscriptions.push(stopCommand)
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate () {}
