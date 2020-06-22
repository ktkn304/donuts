import { Typename } from './types';

export function assertsPropertyExists<T, U extends string>(obj: T, name: U): asserts obj is T & { [K in U]: unknown } {
    assertsIsDefined(obj);
    if (!(name in obj)) {
        throw new Error(`'${name}' does not exists.`);
    }
}

export function assertsPropertyType<T, U extends string, V extends new(...args: any) => any>(obj: T, name: U, type: V): asserts obj is T & { [K in typeof name]: InstanceType<V> };
export function assertsPropertyType<T, U extends string>(obj: T, name: U, type: Typename): asserts obj is T & { [K in U]: any }; // TODO: anyを消したい
export function assertsPropertyType(obj: unknown, name: string, type: Typename | (new(...args: any) => any)): void {
	assertsPropertyExists(obj, name);

    if (typeof type === 'string') {
        if (typeof obj[name] !== type) {
            throw new Error(`'${name}' must be of type: ${type}`);
        }
    } else {
        if (obj[name] instanceof type) {
            throw new Error(`'${name}' must be of type: ${type}`);
        }
    }
}

export function assertsPropertyLiteral(obj: any, name: string, literal: any): void {
    assertsPropertyExists(obj, name);
    if (obj[name] !== literal) {
        throw new Error(`'${name}' must be of literal: ${literal}`);
    }
}

export function assertsIsDefined<T>(obj: T, message?: string): asserts obj is NonNullable<T> {
    if (obj === undefined || obj === null) {
        const msg = message || `Expected 'obj' to be defined, but received ${obj}`;
        throw new Error(msg);
    }
}
