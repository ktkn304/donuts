import * as net from 'net';
import { platform } from 'os';
import { logger } from './logger';
import { ConnectionHandler } from './connection-handler';

export type ServerStatus = 'stop' | 'starting' | 'started' | 'ending' | 'ended';

export class Server {
	static getListenAddress(): string {
		switch(platform()) {
			case 'win32':
				return `\\\\?\\pipe\\vscode.donuts\\${process.pid}`;
			default:
				return `/tmp/vscode.donuts.${process.pid}`;
		}
	}

    private server: net.Server | null = null;
    private status: ServerStatus = 'stop';
    get getStatus(): ServerStatus {
        return this.status;
    }

	constructor() {
	}

	start(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.server) {
				reject('server already started.');
				return;
			}

			const server = net.createServer((connection) => {
				logger.info('client connected.');
				ConnectionHandler.handle(connection);
			});
			server.listen(Server.getListenAddress(), () => {
				logger.info('server bound.');
				this.server = server;
				resolve();
            });
		});
	}

	end(): Promise<unknown> {
		return new Promise((resolve, reject) => {
			if (!this.server) {
				reject('server not started.');
				return;
			}
			this.server.close(() => {
				logger.info('server closed.'); // この時点ですでにconsoleが破棄されているようなので、出力されない。
				resolve();
			});
		});
	}
}
