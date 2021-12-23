import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

/**
 * Mizarフォーマッタを実行する関数
 */
export function formatMizar() {
  if (vscode.window.activeTextEditor === undefined) {
    vscode.window.showErrorMessage('Not currently in .miz file!!');
    return;
  }
  const fileName = vscode.window.activeTextEditor.document.fileName;
  let command = '';
  if (process.platform === 'win32') {
    command = path.join(
        path.dirname(__dirname), 'mizar-formatter', 'mizarformat.exe');
  } else {
    // 設定ファイルからPythonのパスを取得，デフォルト値は"python"
    const pythonPath = vscode.workspace.getConfiguration('Mizar').pythonPath;
    command = pythonPath + ' ' + path.join(
        path.dirname(__dirname), 'mizar-formatter', 'mizarformat.py');
  }
  try {
    cp.execFileSync(command, [fileName]);
    vscode.window.showInformationMessage(
        'The Mizar file has been formatted.');
  } catch (e) {
    console.log(e);
    vscode.window.showErrorMessage(`Formatting failed.
    Set the Python Path "Mizar.pythonPath"
    to be used for formatting the Mizar file in settings.json.`);
  }
}
