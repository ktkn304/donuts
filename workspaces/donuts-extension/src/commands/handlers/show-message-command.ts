import * as vscode from 'vscode';
import { buildCommand } from "../command-handler";
import { MessageOptions } from "vscode";

export const showMessageCommand = buildCommand('show-message', b => b.object({
    properties: {
        severity: b.string({ enums: ['information', 'warning', 'error'] }),
        items: b.array({
            type: b.string()
        }),
        message: b.string(),
        modal: b.bool(),
        wait: b.bool()
    },
    required: ['message']
}), async (args, pipe) => {
    let showMessageFn: (message: string, options: MessageOptions, ...items: string[]) => Thenable<string | undefined>;
    switch(args.severity) {
        case undefined:
        case 'information':
            showMessageFn = vscode.window.showInformationMessage.bind(vscode.window);
            break;
        case 'warning':
            showMessageFn = vscode.window.showWarningMessage.bind(vscode.window);
            break;
        case 'error':
            showMessageFn = vscode.window.showErrorMessage.bind(vscode.window);
            break;
        default:
            const n: never = args.severity;
            throw new Error(`unknown severity: ${args.severity}`);
    }

    const items = args.items == undefined ? [] : args.items;

    const p = showMessageFn(args.message, { modal: args.modal }, ...items);
    if (args.wait) {
        const result = await p;
        if (result != null) {
            pipe.out.write(result);
        }
    }
});
