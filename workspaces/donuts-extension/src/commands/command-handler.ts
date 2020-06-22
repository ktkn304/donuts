import { DuplexPipe } from '../common/types';
import { TypeSchema, TypeSchemaBuilder, TypeSchemaBuilderResult, validate, Resolve } from '../common/type-schema';
import { TerminalIdSchema, TerminalId } from '../common/type-schemas';

export interface CommandHandler<T> {
    readonly name: string;
    readonly argsSchema: TypeSchema;
    assertsArguments(args: unknown): asserts args is T;
    execute(args: T, pipe: DuplexPipe): Promise<void>;
}

class CommandHandlerBase<T> implements CommandHandler<T> {
    constructor(public readonly name: string, public readonly argsSchema: TypeSchema, private executeFn: (args: T, pipe: DuplexPipe) => Promise<void>) {
    }

    assertsArguments(args: unknown): asserts args is T {
        validate(this.argsSchema, args);
    }

    execute(args: T, pipe: DuplexPipe): Promise<void> {
        return this.executeFn(args, pipe);
    }
}

export class ArgumentsSchemaBuilder extends TypeSchemaBuilder {
    terminal(): TypeSchemaBuilderResult<TerminalId> {
        return TerminalIdSchema;
    }
}

export function buildCommand<T>(name: string, typeSchema: TypeSchemaBuilderResult<T> | ((builder: ArgumentsSchemaBuilder) => TypeSchemaBuilderResult<T>), execute: (args: T, pipe: DuplexPipe) => Promise<void>): CommandHandler<T> {
    if (typeof typeSchema === 'function') {
        typeSchema = typeSchema(new ArgumentsSchemaBuilder());
    }
    return new CommandHandlerBase<T>(name, typeSchema.typeSchema, execute);
}
