import * as vscode from 'vscode';
import { buildCommand } from "../command-handler";

export const newFileCommand = buildCommand('new-file', b => b.null(), async (args, pipe) => {
    const document = await vscode.workspace.openTextDocument();
    vscode.window.showTextDocument(document);
    let promise: Thenable<void> = Promise.resolve();
    return new Promise((resolve, reject) => {
        pipe.in.on('data', chunk => {
            promise = promise.then(() => {
                if (document.isClosed) {
                    return Promise.reject('document closed.');
                }
                const edit = new vscode.WorkspaceEdit();
                const pos = document.positionAt(Number.POSITIVE_INFINITY);
                edit.insert(document.uri, pos, chunk.toString());
                return vscode.workspace.applyEdit(edit);
            }).then(undefined, reason => {
                reject(reason);
            });
        });
        pipe.in.on('end', () => {
            promise.then(status => {
                resolve();
            });
        });
    });
});
