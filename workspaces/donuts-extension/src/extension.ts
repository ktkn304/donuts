// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Validity } from './common/types';
import { TerminalId } from './common/type-schemas';
import { logger, LogLevel } from './logger';
import { Server } from './server';

async function getTerminalId(terminal: vscode.Terminal): Promise<Validity<TerminalId>> {
	return terminal.processId.then(id => {
		if (typeof id === 'number') {
			return {
				valid: true,
				value: id.toString()
			};
		} else {
			return {
				valid: false
			};
		}
	});
}

const server = new Server();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	logger.info('donuts is activated.')

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.log.changelevel', () => {
		const items = Object.keys(LogLevel).filter(key => typeof LogLevel[key as any] === 'number');
		vscode.window.showQuickPick(items).then(name => {
			const v = LogLevel[name as any];
			if (typeof v === 'number') {
				logger.applyOptions({ level: v });
			} else {
				logger.error('unknown log level.');
			}
		});
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.gitbash.export', async () => {
		const terminal = vscode.window.activeTerminal;
		if (terminal == null) {
			return;
		}
		const terminalId = await getTerminalId(terminal);
		if (!terminalId.valid) {
			return;
		}
		terminal.sendText(`export VSCODE_DONUTS_TERM_ID='${terminalId.value}'`, true);
	});
	context.subscriptions.push(disposable);

	let gitbash_support = vscode.workspace.getConfiguration('donuts').get('gitbash') === true;
	disposable = vscode.workspace.onDidChangeConfiguration(e => {
		gitbash_support = vscode.workspace.getConfiguration('donuts').get('gitbash') === true;
	});
	context.subscriptions.push(disposable);

	return vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		cancellable: false,
		title: 'server starting.'
	}, (progress, cancel) => {
		return server.start();
	}).then(() => {
		context.environmentVariableCollection.append('VSCODE_DONUTS_ADDR', Server.getListenAddress());
		const injectToTerminal = async (terminal: vscode.Terminal): Promise<void> => {
			const terminalId = await getTerminalId(terminal);
			if (terminalId.valid) {
				terminal.sendText(`export VSCODE_DONUTS_TERM_ID='${terminalId.value}'`, true);
			}
			return;
		};
		const terminals = [...vscode.window.terminals];
		vscode.window.onDidOpenTerminal((terminal) => {
			if (gitbash_support) {
				injectToTerminal(terminal);
			}
			logger.info('terminal open.');
		});
		if (gitbash_support) {
			for (const terminal of terminals) {
				injectToTerminal(terminal);
			}
		}
	}).then(() => {}, err => { logger.error(err) });
}

// this method is called when your extension is deactivated
export function deactivate() {
	return server.end().then(() => {}, err => { logger.error(err); throw err; });
}
