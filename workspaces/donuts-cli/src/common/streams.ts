import * as stream from 'stream';
import * as readline from 'readline';
import { MessageBase, ErrorMessage, assertsMessageBase } from '../messages';

export class NopTransform extends stream.Transform {
	_transform(chunk: any, encoding: string, callback: stream.TransformCallback) {
		this.push(chunk, encoding);
		callback();
	}
}

type MessageStreamEvents = [
	[ 'message', MessageBase<string> ],
	['error', unknown ]
][number];
type MessageStreamEventsListener<T extends [any, any], K> = T extends [K, infer A] ? (args: A) => void : never;
export class MessageStream {
	private reader: readline.Interface;
	private listeners = new Map<MessageStreamEvents[0], Function[]>();
	constructor(private stream: stream.Duplex) {
		this.reader = readline.createInterface(stream);
		this.reader.on('line', this.onLine.bind(this));
	}

	private onLine(line: string) {
		try {
			const msg = JSON.parse(line);
			assertsMessageBase(msg);
			this.emit('message', msg);
		} catch(err) {
			this.emit('error', err);
		}
	}

	private emit(...args: MessageStreamEvents) {
		const listeners = this.listeners.get(args[0]);
		if (listeners === undefined) {
			return;
		}
		for (const listener of listeners) {
			listener(args[1]);
		}
	}

	async write(msg: MessageBase<string>) {
		const str = JSON.stringify(msg) + '\n';
		this.stream.write(str);
	}

	on<T extends MessageStreamEvents[0]>(type: T, listener: MessageStreamEventsListener<MessageStreamEvents, T>) {
		let listeners = this.listeners.get(type);
		if (listeners === undefined) {
			listeners = [];
			this.listeners.set(type, listeners);
		}
		listeners.push(listener);
	}

	off<T extends MessageStreamEvents[0]>(type: T, listener: MessageStreamEventsListener<MessageStreamEvents, T>) {
		let listeners = this.listeners.get(type);
		if (listeners === undefined) {
			return;
		}
		const index = listeners.findIndex(listener => listener === listener);
		if (index < 0) {
			return;
		}
		listeners.splice(index, 1);
	}
}
