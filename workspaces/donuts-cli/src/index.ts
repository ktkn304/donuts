import * as net from 'net';
import * as readline from 'readline';
import * as stream from 'stream';
import yargs = require('yargs');
import { MessageStream } from './common/streams';
import { ChunkMessage, assertsMessageBase, assertsCommandResponseMessage, assertsCommandCompleteMessage, assertsChunkMessage, assertsErrorMessage, Context, MessageBase, ErrorMessage, CommandMessage } from './messages';

const address = process.env.VSCODE_DONUTS_ADDR;
if (!address) {
    console.error('environment variable not set.');
    process.exit(1);
}

const helpCommand: CommandMessage = {
    type: 'command',
    name: 'get-help'
};

const client = net.connect(address, () => {
    const messageStream = new MessageStream(client);
    let cmdYargs = yargs.parserConfiguration({
        "camel-case-expansion": false,
        "strip-aliased": true
    }).demandCommand(0, 1);
    let helpContext: Context | null = null;
    let commandContext: Context | null = null;
    let state: 'help' | 'command' = 'help';
    const typeSchemas = new Map<string, any>();
    messageStream.on('message', msg => {
        switch(msg.type) {
            case 'command-response':
                assertsCommandResponseMessage(msg);
                if (state === 'help') {
                    helpContext = msg.context;
                } else {
                    commandContext = msg.context;
                    const ctx = msg.context;
                    process.stdin.on('data', data => {
                        const message: ChunkMessage = {
                            type: 'chunk',
                            context: ctx,
                            dataType: 'string',
                            data: data.toString()
                        };
                        messageStream.write(message);
                    });
                    process.stdin.on('end', () => {
                        client.end();
                    })
                }
                break;
            case 'command-complete':
                assertsCommandCompleteMessage(msg);
                if (state === 'help') {
                    if (msg.context === helpContext) {
                        state = 'command';
                        const argv = cmdYargs.argv;
                        const command: { type: string; [key: string]: any; } = {
                            type: 'command',
                            name: argv._[0]
                        };
                        if (typeSchemas.get(command.name)?.type !== 'null') {
                            const commandArgs: { [key: string]: any; } = {};
                            for (const [key, val] of Object.entries(argv)) {
                                if (key === '$0' || key === '_' || key === 'interactive') {
                                    continue;
                                }
                                commandArgs[key] = val;
                            }
                            command.args = commandArgs;
                        }
                        messageStream.write(command);
                    }
                } else {
                    if (commandContext !== msg.context) {
                        throw new Error('unknown context');
                    }
                    client.end();
                }
                break;
            case 'chunk':
                assertsChunkMessage(msg);
                if (state === 'help') {
                    if (helpContext !== msg.context) {
                        throw new Error('unknown chunk context');
                    }
                    const obj: { name: string; typeSchema: any; }[] = JSON.parse(msg.data);
                    for (const cmd of obj) {
                        typeSchemas.set(cmd.name, cmd.typeSchema);
                        cmdYargs = cmdYargs.command(cmd.name, false, b => {
                            switch (cmd.typeSchema.type) {
                                case 'any':
                                case 'null':
                                    return;
                                case 'object':
                                    const required: string[] = cmd.typeSchema.required;
                                    for (const name in cmd.typeSchema.properties) {
                                        const childType = cmd.typeSchema.properties[name];
                                        switch (childType.type) {
                                            case 'null':
                                            case 'any':
                                                b.option(name, {});
                                                break;
                                            case 'string':
                                                let defValue: string | undefined = undefined;
                                                if (childType.meta.default != null) {
                                                    for (const def of childType.meta.default) {
                                                        switch (def.source) {
                                                        case 'pid':
                                                            defValue = process.ppid.toString();
                                                            break;
                                                        case 'env':
                                                            defValue = process.env[`VSCODE_DONUTS_${def.name}`];
                                                            break;
                                                        default:
                                                            break;
                                                        }
                                                        if (defValue != null) {
                                                            break;
                                                        }
                                                    }
                                                }
                                                if (defValue != null) {
                                                    b.option(name, { type: 'string', required: required.indexOf(name) >= 0, default: defValue });
                                                } else {
                                                    b.option(name, { type: 'string', required: required.indexOf(name) >= 0});
                                                }
                                                break;
                                            case 'number':
                                                b.option(name, { type: 'number', required: required.indexOf(name) >= 0 });
                                                break;
                                            case 'boolean':
                                                b.option(name, { type: 'boolean', required: required.indexOf(name) >= 0 });
                                                break;
                                            case 'array':
                                                const type = childType.items.type;
                                                b.option(name, { type: type, array: true, required: required.indexOf(name) >= 0 });
                                                break;
                                            default:
                                                throw new Error('unknown');
                                        }
                                    }
                                    break;
                                default:
                                    throw new Error('invalid arguments.');
                            }
                        })
                    }
                } else {
                    if (commandContext !== msg.context) {
                        throw new Error('unknown chunk context');
                    }
                    process.stdout.write(msg.data);
                }
                break;
            case 'error':
                assertsErrorMessage(msg);
                console.error(msg.message);
                throw new Error('error message received.');
            default:
                throw new Error('unknown message.');
        }
    });
    messageStream.on('error', err => {
        if (typeof err === 'string') {
            console.error(err);
        } else if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err);
        }
        client.end();
    });
    messageStream.write(helpCommand);
});
client.on('close', () => {
    process.exit();
});
client.on('end', () => {
});
