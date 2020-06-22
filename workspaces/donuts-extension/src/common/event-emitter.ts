type EventDefine<T> = {
    name: string;
    value: T;
}

type LookupByName<T extends EventDefine<any>, TName extends T['name']> =
    T extends { name: TName } ? T : never;
export class EventEmitter<T extends EventDefine<any>> {
    private listeners = new Map<T['name'], Function[]>();

    // 下記コメントの書き方だとコールバックのパラメータの型推論が効かない
    // on(...[name, callback]: ResolveOnArgs<T>) { ... }
    on<TName extends T['name']>(name: TName, listener: (value: LookupByName<T, TName>['value']) => void) {
        let listeners = this.listeners.get(name);
        if (listeners === undefined) {
            listeners = [];
            this.listeners.set(name, listeners);
        }
        listeners.push(listener);
    }

    off<TName extends T['name']>(name: TName, listener: (value: LookupByName<T, TName>['value']) => void) {
        let listeners = this.listeners.get(name);
        if (listeners === undefined) {
            return;
        }
        const index = listeners.findIndex(fn => fn === listener);
        if (index < 0) {
            return;
        }
        listeners.splice(index, 1);
    }

    // こっちは下記コメントの書き方でも問題ないが、on, offメソッドに合わせる。
    // emit(...[name, value]: ResolveEmitArgs<T>) { ... }
    emit<TName extends T['name']>(name: TName, value: LookupByName<T, TName>['value']) {
        const listeners = this.listeners.get(name);
        if (listeners === undefined) {
            return;
        }
        for (const listener of listeners) {
            listener(value);
        }
    }
}
