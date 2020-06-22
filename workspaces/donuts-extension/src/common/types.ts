import * as stream from 'stream';

export interface DuplexPipe {
	in: stream.Readable;
	out: stream.Writable;
}

const _typename = typeof '';
export type Typename = typeof _typename;

export type PrimitiveType = string | number | boolean | symbol | null | undefined; // bigint

export type Validity<T> = { valid: true; value: T; } | { valid: false; };

export type DeepReadonly<T> =
    T extends Object ? { readonly [ K in keyof T ]: DeepReadonly<T[K]> } :
    T;
