import { assertsPropertyType, assertsPropertyLiteral, assertsPropertyExists } from "./common/asserts";
import { TypeSchema } from "./common/type-schema";

export type Context = number;
export function assertsHasContext<T extends Object, U extends string>(obj: T, name: U): asserts obj is T & { [K in U]: Context } {
	assertsPropertyType(obj, name, 'number');
}

export type Messages = CommandMessage | ChunkMessage;

export interface MessageBase<T extends string> {
	type: T;
}
export function assertsMessageBase(obj: unknown): asserts obj is MessageBase<string> {
	assertsPropertyType(obj, 'type', 'string');
}

export interface CommandMessage extends MessageBase<'command'> {
	type: 'command';
	name: string;
	args?: unknown;
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
