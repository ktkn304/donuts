import * as net from 'net';
import * as stream from 'stream';
import { Context, ErrorMessage, MessageBase, assertsMessageBase, assertsCommandMessage, assertsChunkMessage, ChunkMessage, CommandResponseMessage, CommandCompleteMessage } from './messages';
import { ObjectStream, NopTransform } from './common/streams';
import CommandDispatcher from './commands/command-set/default';

export class ConnectionHandler {
	static async handle(connection: net.Socket): Promise<void> {
		const handler = new ConnectionHandler(connection);
		return handler.start();
	}

	private readonly pipes = new Map<Context, { in: stream.Duplex, out: stream.Duplex }>();
	private maxContextId = 0;
	private objectStream: ObjectStream;

	private constructor(private connection: net.Socket) {
		this.objectStream = new ObjectStream(connection);
	}

	private createErrorMessage(error?: any, context?: Context): ErrorMessage {
		let message = 'an error occurred.';
		if (error === undefined || error === null) {
		} else if (error instanceof Error) {
			message = error.message;
		} else if (typeof error === 'string') {
			message = error;
		}
		return new ErrorMessage(message, context);
	}

	private getContext(): Context {
		return this.maxContextId++;
	}

	async onCommandMessage(message: MessageBase<string>) {
		assertsCommandMessage(message);
		const context = this.getContext(); 
		const pipe = {
			in: new NopTransform(),
			out: new NopTransform()
		};
		pipe.out.on('data', (chunk) => {
			const message: ChunkMessage = {
				type: 'chunk',
				context: context,
				dataType: 'string',
				data: chunk.toString()
			};
			this.objectStream.write(message);
		});
		this.pipes.set(context, pipe);
		
		try {
			const response: CommandResponseMessage = {
				type: 'command-response',
				context: context
			};
			this.objectStream.write(response);
			await CommandDispatcher.execute(message.name, message.args, pipe).catch(err => {
				if (err instanceof ErrorMessage) {
					throw err;
				}
				throw this.createErrorMessage(err, context);
			});
			const completeMessage: CommandCompleteMessage = {
				type: 'command-complete',
				context
			};
			this.objectStream.write(completeMessage);
		} finally {
			const pipes = this.pipes.get(context);
			pipes?.in.end();
			pipes?.out.end();
			this.pipes.delete(context);
		}
	}

	async onChunkMessage(message: MessageBase<string>) {
		assertsChunkMessage(message);
		const pipe = this.pipes.get(message.context);
		if (!pipe) {
			throw new Error('context not found.');
		}
		pipe.in.write(message.data);
	}

	async dispatchMessage(message: MessageBase<string>) {
		const handlers = {
			'command': this.onCommandMessage,
			'chunk': this.onChunkMessage
		};

		if (!(message.type in handlers)) {
			throw new Error('unknown message.');
		}
		const handler = handlers[message.type as keyof typeof handlers];
		await handler.call(this, message);
	}

	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			let count = 1;
			const unref = () => {
				count--;
				if (count === 0) {
					this.connection.end();
				}
			};
			const ref = () => {
				count++;
			};
			this.connection.on('close', (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
			this.connection.on('end', () => {
				for (const pipes of this.pipes.values()) {
					pipes.in.end();
				}
				unref();
			});
			this.objectStream.on('object', async (obj) => {
				ref();
				try {
					assertsMessageBase(obj);
					await this.dispatchMessage(obj);
				} catch(err) {
					const errMsg = err instanceof ErrorMessage ? err : this.createErrorMessage(err);
					this.objectStream.write(errMsg);
				}
				unref();
			});
			this.objectStream.on('error', async (err) => {
				const errorMessage = this.createErrorMessage(err);
				this.objectStream.write(errorMessage);
			});
			this.connection.resume();
		});
	}
}
