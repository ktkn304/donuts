import { assertsPropertyType, assertsPropertyLiteral } from "./common/asserts";

export type Context = number;
export function assertsHasContext<T extends Object, U extends string>(obj: T, name: U): asserts obj is T & { [K in U]: Context } {
	assertsPropertyType(obj, name, 'number');
}

export type Messages = CommandMessage | ChunkMessage;

export interface MessageBase<T extends string> {
	type: T;
}
export function assertsMessageBase(obj: Object): asserts obj is MessageBase<string> {
	assertsPropertyType(obj, 'type', 'string');
}

export interface CommandMessage extends MessageBase<'command'> {
	type: 'command';
	name: string;
	args?: Object;
}
export function assertsCommandMessage(obj: Object): asserts obj is CommandMessage {
	assertsPropertyLiteral(obj, 'type', 'command');
	assertsPropertyType(obj, 'name', 'string');
}
export interface CommandResponseMessage extends MessageBase<'command-response'> {
	type: 'command-response';
	context: Context;
}
export function assertsCommandResponseMessage(obj: Object): asserts obj is CommandResponseMessage {
	assertsPropertyLiteral(obj, 'type', 'command-response');
	assertsHasContext(obj, 'context');
}
export interface CommandCompleteMessage extends MessageBase<'command-complete'> {
	type: 'command-complete';
	context: Context;
}
export function assertsCommandCompleteMessage(obj: Object): asserts obj is CommandCompleteMessage {
	assertsPropertyLiteral(obj, 'type', 'command-complete');
	assertsHasContext(obj, 'context');
}

export interface ChunkMessage {
	type: 'chunk';
	context: Context;
	dataType: 'string';
	data: string;
}
export function assertsChunkMessage(obj: Object): asserts obj is ChunkMessage {
	assertsPropertyLiteral(obj, 'type', 'chunk');
	assertsHasContext(obj, 'context');
	assertsPropertyLiteral(obj, 'dataType', 'string');
	assertsPropertyType(obj, 'data', 'string');
}

export class ErrorMessage implements MessageBase<'error'> {
	readonly type = 'error';
	readonly context?: Context;
	readonly message: string;
	constructor(message: string, context?: Context) {
		if (context !== undefined) {
			this.context = context;
		}
		this.message = message;
	}
}
export function assertsErrorMessage(obj: Object): asserts obj is ErrorMessage {
	assertsPropertyLiteral(obj, 'type', 'error');
	if ('context' in obj) {
		assertsHasContext(obj, 'context');
	}
	assertsPropertyType(obj, 'message', 'string');
}

/*
export interface MessageBaseOld {
	type: string;
}

export interface GetTextMessage extends MessageBaseOld {
	type: 'get-text';
	selected?: boolean;
}
export function isGetTextmessage(msg: any): msg is GetTextMessage {
	return msg.type === 'get-text' && existsOptionalProperty(msg, 'selected', 'boolean');
}

export interface GetTextResponseMessage extends MessageBaseOld {
	type: 'get-text-response';
	text: string;
}

export interface InsertTextMessage extends MessageBaseOld {
	type: 'insert-text';
	text: string;
}
export function isInsertTextMessage(msg: any): msg is InsertTextMessage {
	return msg.type === 'insert-text' && typeof msg.text === 'string';
}

export interface InsertTextResponseMessage extends MessageBaseOld {
	type: 'insert-text-response';
}

export interface ExecuteCommandMessage extends MessageBaseOld {
	type: 'execute-command';
	command: string;
	args?: any[];
}
export function isExecuteCommandMessage(msg: any): msg is ExecuteCommandMessage {
	return msg.type === 'execute-command' && typeof msg.command === 'string' && existsOptionalProperty(msg, 'args', Array);
}

export interface ExecuteCommandResponseMessage extends MessageBaseOld {
	type: 'execute-command-response';
	result: any;
}

export interface ChangeTerminalNameMessage extends MessageBaseOld {
	type: 'change-terminal-name';
	id: number;
	name: string;
}
export function isChangeTerminalNameMessage(msg: any): msg is ChangeTerminalNameMessage {
	return msg.type === 'change-terminal-name' && typeof msg.id === 'number' && typeof msg.name === 'string';
}

export interface ChangeTerminalNameResponseMessage extends MessageBaseOld {
	type: 'change-terminal-name-response';
}

export interface NewFileMessage extends MessageBaseOld {
	type: 'new-file';
	text: string;
}
export function isNewFileMessage(msg: any): msg is NewFileMessage {
	return msg.type === 'new-file' && typeof msg.text === 'string';
}

export interface NewFileResponseMessage extends MessageBaseOld {
	type: 'new-file-response';
}

export class ErrorMessage implements MessageBaseOld {
	type = 'error' as const;
	message: string;

	constructor(message: string) {
		this.message = message;
	}
}
*/
