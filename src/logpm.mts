/**
 * Available logging levels
 */
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

interface TokenizedMessage {
    message: string;
    tokens: any;
}

/**
 * Special class with internals. Not accessible to outside world despite declaration.
 * Warning: "export" keyword gets removed after tests
 */
export class Internals {
    #reTokens = /\{(?<token>[^{}]+?)\}/gim;

    /**
     *
     * @param message Message to log with argument placeholders to be filled
     * @param args Arguments to be inserted in message template
     * @returns Evaluated message and tokens.
     */
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
    /**
     * Returns current time
     * @returns Current time
     */
    get now(): string;
}

/**
 * Provides current time in UTC format
 */
export class DefaultTimeProvider implements TimeProvider {
    get now(): string {
        return new Date().toISOString();
    }
}

export interface LogStream {
    /**
     * Writes log object to output of choice
     * @param obj Log entity to write to log
     */
    write(obj: any): void;
}

/**
 * Writes logs as JSONs to STDOUT
 */
export class ConsoleLogStream implements LogStream {
    write(obj: any): void {
        const text = JSON.stringify(obj);
        console.log(text);
    }
}

/**
 * Semantic logging class
 */
export class Logger {
    #context: string;
    #scope?: any;
    #time: TimeProvider;
    #stream: LogStream;

    /**
     * Create Logger instance
     * @constructor
     * @param context (reqired) Name the context where operations are logged. Usually name of the class
     * @param scope (optional) Common scope object for all logged messages
     * @param timeProvider (optional/advanced) Leave null for default behavior or provide custom way to assign timestamps
     * @param stream (optional/advanced) Leave null for default behavior or pass custom nonblocking stream. Async operations are not supported and not desired
     */
    constructor(
        context: string,
        scope?: any,
        timeProvider?: TimeProvider,
        stream?: LogStream
    ) {
        this.#context = context || '';
        this.#scope = Object.freeze({ ...scope } || null);
        this.#time = timeProvider || new DefaultTimeProvider();
        this.#stream = stream || new ConsoleLogStream();
    }

    /**
     * Creates new sub scope from existing logger
     * @param context New scope context name
     * @param scope Optional scope data
     * @returns {Logger}
     */
    scopeTo(context: string, scope?: any): Logger {
        // merge current scope with provided scope
        const innerScope = this.#scope ? { ...this.#scope, ...scope } : scope;
        return new Logger(context, innerScope, this.#time, this.#stream);
    }

    /**
     * Error log
     * @param message Message to log. May contain placeholders in format: {name}
     * @param args Arguments to fill within placeholders. Order of placeholders matches order of arguments
     */
    e(message: string, ...args: any[]): void {
        this.ll(LogLevel.Error, message, ...args);
    }

    /**
     * Warning log
     * @param message Message to log. May contain placeholders in format: {name}
     * @param args Arguments to fill within placeholders. Order of placeholders matches order of arguments
     */
    w(message: string, ...args: any[]): void {
        this.ll(LogLevel.Warn, message, ...args);
    }

    /**
     * Information log
     * @param message Message to log. May contain placeholders in format: {name}
     * @param args Arguments to fill within placeholders. Order of placeholders matches order of arguments
     */
    i(message: string, ...args: any[]): void {
        this.ll(LogLevel.Info, message, ...args);
    }

    /**
     * Debug log
     * @param message Message to log. May contain placeholders in format: {name}
     * @param args Arguments to fill within placeholders. Order of placeholders matches order of arguments
     */
    d(message: string, ...args: any[]): void {
        this.ll(LogLevel.Debug, message, ...args);
    }

    /**
     * Trace (verbose) log
     * @param message Message to log. May contain placeholders in format: {name}
     * @param args Arguments to fill within placeholders. Order of placeholders matches order of arguments
     */
    t(message: string, ...args: any[]): void {
        this.ll(LogLevel.Trace, message, ...args);
    }

    /**
     * Log with level
     * @param level Logging level
     * @param message Message to log. May contain placeholders in format: {name}
     * @param args Arguments to fill within placeholders. Order of placeholders matches order of arguments
     */
    ll(level: LogLevelValues, message: string, ...args: any[]): void {
        const obj: any = {
            '@timestamp': this.#time.now,
            context: this.#context,
            level: LogLevelTextMap[level] || LogLevelTextMap[LogLevel.Info],
            message,
            ...this.#scope,
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
