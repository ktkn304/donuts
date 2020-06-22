import * as vscode from 'vscode';
import { buildCommand } from "../command-handler";

async function findTerminal(targetPid: number): Promise<vscode.Terminal | undefined> {
    let done = false;
    for (const terminal of vscode.window.terminals) {
        const pid = await terminal.processId;
        if (!done && pid === targetPid) {
            return terminal;
        }
    }
    return undefined;
}

export const getTerminalName = buildCommand('get-terminal-name', b => b.object({
    properties: {
        terminal: b.terminal()
    },
    required: ['terminal']
}), async (args, pipe) => {
    const terminal = await findTerminal(Number(args.terminal));
    if (!terminal) {
        throw new Error('terminal not found.');
    }
    return new Promise((resolve, reject) => { pipe.out.write(terminal.name, err => {
        if (err != null) {
            reject(err);
        } else {
            resolve();
        }
    }); });
});
