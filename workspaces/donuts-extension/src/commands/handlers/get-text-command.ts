import * as vscode from 'vscode';
import { ArgumentsSchemaBuilder, buildCommand } from "../command-handler";

export const getTextCommand = buildCommand('get-text', b => b.object({
	properties: {
		selected: b.bool()
	},
	required: []
}), async (args, pipe) => {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		throw new Error('active editor not exists.');
	}

	let text: string;
	if (args.selected) {
		text = editor.selections.map(range => editor.document.getText(range)).join('\n');
	} else {
		text = editor.document.getText();
	}

	return new Promise((resolve, reject) => {
		pipe.out.write(text, err => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	})
})
