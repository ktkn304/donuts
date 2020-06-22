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

export const renameTerminalCommand = buildCommand('rename-terminal', b => b.object({
    properties: {
        terminal: b.terminal(),
        name: b.string()
    },
    required: ['terminal', 'name']
}), async (args, pipe) => {
    const terminal = await findTerminal(Number(args.terminal));
    if (!terminal) {
        throw new Error('terminal not found.');
    }
    terminal.show(true);
    await vscode.commands.executeCommand('workbench.action.terminal.renameWithArg', { name: args.name });
});
