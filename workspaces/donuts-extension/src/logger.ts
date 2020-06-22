import * as vscode from 'vscode';

export enum LogLevel {
    Debug = 0,
    Info,
    Warn,
    Error
}
interface LoggerOptions {
    level: LogLevel;
}

class Logger {
    private options: LoggerOptions = {
        level: LogLevel.Error
    };
    private output = vscode.window.createOutputChannel('Donuts');
    private disposed: boolean = false;

    constructor() {
    }

    private isEnabled(level: LogLevel): boolean {
        return this.output != null && this.options.level <= level;
    }

    private format(level: LogLevel, message: string): string {
        const date = new Date();
        return `[${LogLevel[level]} - ${date.toDateString()}] ${message}`;
    }

    applyOptions(options: Partial<LoggerOptions>) {
        const keys: (keyof LoggerOptions)[] = ['level'];
        for (const k of keys) {
            if (k in options) {
                this.options[k] = options[k] as any;
            }
        }
    }

    log(level: LogLevel, msg: string): void {
        if (!this.isEnabled(level)) {
            return;
        }
        const s = this.format(level, msg);
        this.output?.appendLine(s);
    }

    debug(msg: string): void {
        return this.log(LogLevel.Debug, msg);
    }

    info(msg: string): void {
        return this.log(LogLevel.Info, msg);
    }

    warn(msg: string): void {
        return this.log(LogLevel.Warn, msg);
    }

    error(obj: any): void;
    error(msg: string): void;
    error(obj: unknown): void {
        if (typeof obj === 'string') {
            return this.log(LogLevel.Error, obj);
        } else if (obj instanceof Error) {
            return this.log(LogLevel.Error, obj.message);
        } else {
            return this.log(LogLevel.Error, String(obj));
        }
        
    }

    dispose() {
        if (this.disposed) {
            return;
        }
        this.output.dispose();
        this.disposed = true;
    }
}

export const logger = new Logger();
