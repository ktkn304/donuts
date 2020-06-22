interface DefaultValue {
    source: 'pid';
}

interface DefaultEnv {
    source: 'env';
    name: string;
}

type Default = DefaultEnv | DefaultValue;

interface TypeSchemaMeta {
    default?: Default[];
}

interface TypeSchemaBase {
    meta: TypeSchemaMeta;
}

interface TypeSchemaBoolean extends TypeSchemaBase {
    type: 'boolean';
}

interface TypeSchemaNumber extends TypeSchemaBase {
    type: 'number';
    enum?: number[];
}

interface TypeSchemaString extends TypeSchemaBase {
    type: 'string';
    enum?: string[];
}

interface TypeSchemaArray extends TypeSchemaBase {
    type: 'array';
    items: TypeSchema;
}

interface TypeSchemaObject extends TypeSchemaBase {
    type: 'object';
    properties: {
        [name: string]: TypeSchema;
    };
    required: string[];
}

interface TypeSchemaNull extends TypeSchemaBase {
    type: 'null';
}

interface TypeSchemaAny extends TypeSchemaBase {
    type: 'any';
}

interface TypeSchemaUnion extends TypeSchemaBase {
    type: 'union';
    anyOf: TypeSchema[];
}

export type TypeSchema = TypeSchemaBoolean | TypeSchemaNumber | TypeSchemaString | TypeSchemaArray | TypeSchemaObject | TypeSchemaAny | TypeSchemaNull | TypeSchemaUnion;

export interface TypeSchemaBuilderResult<T> {
    readonly typeSchema: TypeSchema;
}
export type Resolve<T extends TypeSchemaBuilderResult<any>> = T extends TypeSchemaBuilderResult<infer U> ? U : never;
type ResolveObject<T extends { [name: string]: TypeSchemaBuilderResult<any> }, TReq extends keyof T> = {
    [K in keyof Omit<T, TReq>]?: Resolve<T[K]>;
} & {
    [K in keyof Pick<T, TReq>]: Resolve<T[K]>;
};

interface BuilderArgs {
    default?: Default[]
}

export class TypeSchemaBuilder {
    private createMeta(args?: BuilderArgs): TypeSchema['meta'] {
        if (args == null) {
            return {};
        }
        const meta: TypeSchema['meta'] = {};
        if (args.default != null) {
            meta.default = args.default;
        }
        return meta;
    }

    object<T extends { [name: string]: TypeSchemaBuilderResult<any>; }, TReq extends keyof T>(args: BuilderArgs & { properties: T, required: TReq[] }): TypeSchemaBuilderResult<ResolveObject<T, TReq>> {
        const schema: TypeSchema = {
            type: 'object',
            properties: {},
            required: args.required as string[], // なぜかエラーになるので…
            meta: this.createMeta(args)
        };
        for (const k of Object.keys(args.properties)) {
            schema.properties[k] = args.properties[k].typeSchema;
        }
        return {
            typeSchema: schema
        };
    }

    array<T>(args: BuilderArgs & { type: TypeSchemaBuilderResult<T> }): TypeSchemaBuilderResult<T[]> {
        const schema: TypeSchema = {
            type: 'array',
            items: args.type.typeSchema,
            meta: this.createMeta(args)
        };
        return {
            typeSchema: schema
        };
    }

    union<T1 extends TypeSchemaBuilderResult<any>, T2 extends T1[]>(args: BuilderArgs & { types: T2 }): TypeSchemaBuilderResult<Resolve<T2[number]>> {
        const schema: TypeSchema = {
            type: 'union',
            anyOf: args.types.map(r => r.typeSchema),
            meta: this.createMeta(args)
        };
        return {
            typeSchema: schema
        };
    }

    bool(args?: BuilderArgs): TypeSchemaBuilderResult<boolean> {
        const schema: TypeSchema = {
            type: 'boolean',
            meta: this.createMeta(args)
        };
        return {
            typeSchema: schema
        };
    }

    null(args?: BuilderArgs): TypeSchemaBuilderResult<null> {
        const schema: TypeSchema = {
            type: 'null',
            meta: this.createMeta(args)
        };
        return {
            typeSchema: schema
        };
    }

    any(args?: BuilderArgs): TypeSchemaBuilderResult<unknown> {
        const schema: TypeSchema = {
            type: 'any',
            meta: this.createMeta(args)
        };
        return {
            typeSchema: schema
        };
    }

    number(args?: BuilderArgs): TypeSchemaBuilderResult<number>;
    number<T extends number, TEnum extends T[]>(args: BuilderArgs & { enums: TEnum }): TypeSchemaBuilderResult<TEnum[number]>;
    number(args?: BuilderArgs | (BuilderArgs & { enums: number[] })): TypeSchemaBuilderResult<number> {
        const schema: TypeSchema = {
            type: 'number',
            meta: this.createMeta(args)
        };
        if (args != null && 'enums' in args) {
            schema.enum = args.enums;
        }
        return {
            typeSchema: schema
        };
    }

    string(args?: BuilderArgs): TypeSchemaBuilderResult<string>;
    string<T extends string, TEnum extends T[]>(args: BuilderArgs & { enums: TEnum }): TypeSchemaBuilderResult<TEnum[number]>;
    string(args: BuilderArgs | (BuilderArgs & { enums: string[] })): TypeSchemaBuilderResult<string> {
        const schema: TypeSchema = {
            type: 'string',
            meta: this.createMeta(args)
        };
        if (args != null && 'enums' in args) {
            schema.enum = args.enums;
        }
        return {
            typeSchema: schema
        };
    }
}

export function validate(schema: TypeSchema, obj: unknown): void {
    if (obj == null) {
        if (schema.type !== 'null' && schema.type !== 'any') {
            throw new Error();
        }
        return;
    }
    switch (schema.type) {
    case 'null':
        throw new Error();
    case 'boolean':
        if (typeof obj !== schema.type) {
            throw new Error();
        }
        break;
    case 'string':
    case 'number':
        if (typeof obj !== schema.type) {
            throw new Error();
        }
        if (schema.enum && (schema.enum as any[]).indexOf(obj) < 0) {
            throw new Error();
        }
        break;
    case 'any':
        break;
    case 'array':
        if (!Array.isArray(obj)) {
            throw new Error();
        }
        for (const item of obj) {
            validate(schema.items, item);
        }
        break;
    case 'union':
        let valid = false;
        for (const scm of schema.anyOf) {
            try {
                validate(scm, obj);
                valid = true;
                break;
            } catch(err) {}
        }
        if (!valid) {
            throw new Error();
        }
        break;
    case 'object':
        if (typeof obj !== 'object') {
            throw new Error();
        }
        for (const k of Object.keys(schema.properties)) {
            const v = schema.properties[k];
            const child: unknown = (obj as any)[k];
            if (child == null) {
                if (schema.required.indexOf(k) >= 0) {
                    throw new Error();
                }
                continue;
            }
            validate(v, child);
        }
        break;
    default:
        const x: never = schema;
        throw new Error();
    }
}
