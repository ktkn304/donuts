import * as vscode from 'vscode';
import { CommandHandler, buildCommand, ArgumentsSchemaBuilder } from "../command-handler";
import { DuplexPipe } from '../../common/types';
import { assertsPropertyType } from '../../common/asserts';

export const echoCommand = buildCommand('echo', b => b.any(), async (args, pipe) => {
    console.log('echo command started.');
    console.log(args);
    pipe.out.write(JSON.stringify(args));
    pipe.in.on('data', chunk => {
        pipe.out.write(chunk);
    });
    return new Promise(resolve => {
        pipe.in.on('end', () => {
            resolve();
        });
    });
});
