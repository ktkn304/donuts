import * as stream from 'stream';
import * as readline from 'readline';
import { MessageBase, ErrorMessage, assertsMessageBase } from '../messages';
import { EventEmitter } from './event-emitter';
import { logger } from '../logger';

export class NopTransform extends stream.Transform {
	_transform(chunk: any, encoding: string, callback: stream.TransformCallback) {
		this.push(chunk, encoding);
		callback();
	}
}

export class ObjectStream {
	private events = new EventEmitter<{ name: 'object'; value: unknown; } | { name: 'error'; value: unknown }>();
	on = this.events.on.bind(this.events);
	off = this.events.off.bind(this.events);

	private reader: readline.Interface;

	constructor(private stream: stream.Duplex) {
		this.reader = readline.createInterface(stream);
		this.reader.on('line', this.onLine);
	}
	private onLine = (line: string) => {
		logger.debug(`line received: ${line}`);
		try {
			const obj = JSON.parse(line);
			this.events.emit('object', obj);
		} catch(err) {
			this.events.emit('error', err);
		}
	}

	async write(obj: unknown) {
		return new Promise((resolve, reject) => {
			const line = JSON.stringify(obj) + '\n';
			logger.debug(`line send: ${line}`);
			this.stream.write(line, (error) => {
				if (error == null) {
					resolve();
				} else {
					reject(error);
				}
			});
		});
	}
}
