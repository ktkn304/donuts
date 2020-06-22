import { CommandHandler, buildCommand } from "./command-handler";
import { DuplexPipe } from "../common/types";
import { TypeSchema } from "../common/type-schema";

export class CommandDispatcher {
    private readonly commands = new Array<CommandHandler<any>>();

    constructor() {
        this.commands.push(buildCommand('get-help', b => b.any(), async (args, pipe) => {
            const helps = this.commands.map(command => {
                return {
                    name: command.name,
                    typeSchema: command.argsSchema
                };
            });
            return new Promise((resolve, reject) => {
                pipe.out.write(JSON.stringify(helps), err => {
                    if (err != null) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }));
    }
    private forceGetCommand(name: string): CommandHandler<any> {
        const command = this.commands.find(cmd => cmd.name === name);
        if (!command) {
            throw new Error('command not found.');
        }
        return command;
    }

    regist(command: CommandHandler<any>) {
        this.commands.push(command);
    }
    async execute(name: string, args: unknown, pipe: DuplexPipe): Promise<void> {
        const command: CommandHandler<any> = this.forceGetCommand(name);
        command.assertsArguments(args);
        return command.execute(args, pipe);
    }
}
