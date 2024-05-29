export const LogLevel = Object.freeze({
    Error: 1,
    Warn: 2,
    Info: 3,
    Debug: 4,
    Trace: 5,
});
export type LogLevelValues = (typeof LogLevel)[keyof typeof LogLevel];

const LogLevelTextMap = Object.freeze({
    1: 'error',
    2: 'warn',
    3: 'info',
    4: 'debug',
    5: 'trace',
});

export interface TokenizedMessage {
    message: string;
    tokens: any;
}

/**
 * Special class with internals. Not accessible to outside world despite declaration.
 * Warning: "export" keyword gets removed after tests
 */
export class Internals {
    #reTokens = /\{(?<token>[^{}]+?)\}/gim;

    tokenize(message: string, ...args: any[]): TokenizedMessage {
        // filled in message with tokens
        let msg = message || '';
        // map of tokens inside message with matching values
        const tokens: any = {};
        // argument number in arguments array
        let argPos = 0;
        // current match of the regexp
        let match: RegExpExecArray | null = null;

        // extract tokens into an object
        while (null !== (match = this.#reTokens.exec(message))) {
            /**
             * Argument value from arguments array
             */
            const argVal = args?.[argPos++] || null;
            const token = match.groups?.token;
            if (token && !tokens[token]) {
                tokens[token] = argVal;
            }
        }

        // fill message with evaluated token values
        for (const [key, val] of Object.entries(tokens)) {
            msg = msg.replaceAll(`{${key}}`, val as any);
        }

        return {
            message: msg,
            tokens,
        };
    }
}

const _internals = new Internals();

export interface TimeProvider {
    get now(): string;
}

export class DefaultTimeProvider implements TimeProvider {
    get now(): string {
        return new Date().toISOString();
    }
}

export interface LogStream {
    write(obj: any): void;
}

export class ConsoleLogStream implements LogStream {
    write(obj: any): void {
        const text = JSON.stringify(obj);
        console.log(text);
    }
}

export class Logger {
    #context: string;
    #time: TimeProvider;
    #stream: LogStream;

    constructor(
        context?: string,
        timeProvider?: TimeProvider,
        stream?: LogStream
    ) {
        this.#context = context || '';
        this.#time = timeProvider || new DefaultTimeProvider();
        this.#stream = stream || new ConsoleLogStream();
    }

    ll(level: LogLevelValues, message: string, ...args: any[]): void {
        const obj: any = {
            '@timestamp': this.#time.now,
            context: this.#context,
            level: LogLevelTextMap[level] || LogLevelTextMap[LogLevel.Info],
            message,
        };

        const tokenized = _internals.tokenize(message, ...args);

        obj.message = tokenized.message;

        for (let key of Object.getOwnPropertyNames(tokenized.tokens)) {
            // yes, property overwrites is allowed here
            obj[key] = tokenized.tokens[key];
        }

        this.#stream.write(obj);
    }
}
