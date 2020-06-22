import * as vscode from 'vscode';
import { buildCommand } from "../command-handler";
import { assertsIsDefined } from '../../common/asserts';

export const insertTextCommand = buildCommand('insert-text', b => b.object({
	properties: {
		replace: b.bool(),
		multiple: b.bool()
	},
	required: []
}), async (args, pipe) => {
	const insert: (builder: vscode.TextEditorEdit, selection: vscode.Selection, text: string) => void =
		args.replace
			? (builder, selection, text) => { builder.replace(selection, text); }
			: (builder, selection, text) => { builder.insert(selection.start, text); };
	const getSelection: (editor: vscode.TextEditor) => vscode.Selection[] =
		args.multiple ? editor => editor.selections : editor => [editor.selection];

	let promise: Thenable<void> = Promise.resolve();
	return new Promise((resolve, reject) => {
		pipe.in.on('data', chunk => {
			const text = chunk.toString();
			promise = promise.then(() => {
				const editor = vscode.window.activeTextEditor;
				assertsIsDefined(editor, 'active text editor does not exists.');
				return editor.edit((builder => {
					const selections = getSelection(editor);
					for (const selection of selections) {
						insert(builder, selection, text);
					}
				}));
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
