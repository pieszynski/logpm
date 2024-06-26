import {
    ConsoleLogStream,
    DefaultTimeProvider,
    Internals,
    LogLevel,
    LogLevelValues,
    LogStream,
    Logger,
    TimeProvider,
} from './logpm.mjs';

describe('Internals', function () {
    const _internals = new Internals();

    it('should tokenize empty data', function () {
        const res = _internals.tokenize(<any>null);
        expect(res).not.toBeFalsy();
        expect(res.message).toEqual('');
        expect(res.tokens).toBeInstanceOf(Object);
    });

    it('should tokenize data without args', function () {
        const res = _internals.tokenize('text1');
        expect(res).not.toBeFalsy();
        expect(res.message).toEqual('text1');
        expect(res.tokens).toBeInstanceOf(Object);
    });

    it('should tokenize data with args', function () {
        const res = _internals.tokenize(
            'my {name} has {count} times {NaMe} spelled',
            'Przemek',
            15,
            'gwóźdź'
        );
        expect(res).not.toBeFalsy();
        expect(res.message).toEqual('my Przemek has 15 times gwóźdź spelled');
        expect(res.tokens).toEqual(
            jasmine.objectContaining({
                name: 'Przemek',
                count: 15,
                NaMe: 'gwóźdź',
            })
        );
    });

    it('should write null for missing tokens', function () {
        const res = _internals.tokenize(
            'my {name} has {count} times {name} spelled',
            'Imię'
        );
        expect(res).not.toBeFalsy();
        expect(res.message).toEqual('my Imię has null times Imię spelled');
        expect(res.tokens).toEqual(
            jasmine.objectContaining({
                name: 'Imię',
                count: null,
            })
        );
    });

    it('should handle invalid semantic', function () {
        const res = _internals.tokenize('my count} {name{ is', 'Imię');
        expect(res).not.toBeFalsy();
        expect(res.message).toEqual('my count} {name{ is');
        expect(res.tokens.name).toBeUndefined();
        expect(res.tokens.count).toBeUndefined();
    });

    it('should handle invalid invalid token gap', function () {
        const res = _internals.tokenize(
            'my {name is {where} there',
            'Imię',
            'over'
        );
        expect(res).not.toBeFalsy();
        expect(res.message).toEqual('my {name is Imię there');
        expect(res.tokens.where).toEqual('Imię');
        expect(res.tokens.name).toBeUndefined();
    });
});

const NowTime = '2024-05-04T08:39:33.905Z';

class TestTimeProvider implements TimeProvider {
    get now() {
        return NowTime;
    }
}

class TestLogStream implements LogStream {
    obj?: any;
    write(obj: any): void {
        this.obj = obj;
    }
}

describe('TimeProvider', function () {
    it('should show current time', function () {
        const timeNow = new DefaultTimeProvider().now;
        const testNow = new Date();
        const timeMillis = new Date(timeNow);
        const timeDiff = testNow.getTime() - timeMillis.getTime();
        expect(timeDiff).toBeLessThan(100);
    });

    it('should equal to test values when substituted', function () {
        const timeNow = new TestTimeProvider();
        expect(timeNow.now).toEqual(NowTime);
    });
});

describe('LogStream', function () {
    it('should print json to console', function () {
        spyOn(console, 'log');
        const stream = new ConsoleLogStream();
        stream.write({ name: 'Przemek', count: 1 });
        expect(console.log).toHaveBeenCalledOnceWith(
            '{"name":"Przemek","count":1}'
        );
    });

    it('should preserve last value inside testing mock', function () {
        const obj = { name: 'Przemek', count: 1 };
        const stream = new TestLogStream();
        stream.write(null);
        stream.write({});
        stream.write(obj);
        expect(stream.obj).toEqual(obj);
    });
});

describe('Logger', function () {
    const testContext = 'tests';

    let time = new TestTimeProvider();
    let stream = new TestLogStream();
    let log: Logger;

    beforeEach(function () {
        log = new Logger(testContext, null, time, stream);
    });

    it('should have levels', function () {
        expect(LogLevel.Error).toBe(1);
        expect(LogLevel.Warn).toBe(2);
        expect(LogLevel.Info).toBe(3);
        expect(LogLevel.Debug).toBe(4);
        expect(LogLevel.Trace).toBe(5);
    });

    it('should get context as string', function () {
        expect(function () {
            const log = new Logger(
                <any>{ context: 'objctx' },
                null,
                new TestTimeProvider(),
                new TestLogStream()
            );
        }).toThrow(new Error('Context must be a string'));
    });

    it('should consume three constructor parameters in specific order', function () {
        const log = new Logger(
            'default',
            null,
            new TestTimeProvider(),
            new TestLogStream()
        );
        expect(log).toBeTruthy();
    });

    it('should log unknown level as information', function () {
        log.ll(<LogLevelValues>55, 'text1');
        expect(stream?.obj?.level).toEqual('info');
    });

    it('should log with error level', function () {
        log.e('text-{v}-{l}', 1, LogLevel.Error);
        expect(stream?.obj?.level).toEqual('error');
        expect(stream?.obj?.message).toEqual('text-1-1');
    });

    it('should log with warning level', function () {
        log.w('text-{v}-{l}', 2, LogLevel.Warn);
        expect(stream?.obj?.level).toEqual('warn');
        expect(stream?.obj?.message).toEqual('text-2-2');
    });

    it('should log with information level', function () {
        log.i('text-{v}-{l}', 3, LogLevel.Info);
        expect(stream?.obj?.level).toEqual('info');
        expect(stream?.obj?.message).toEqual('text-3-3');
    });

    it('should log with debug level', function () {
        log.d('text-{v}-{l}', 4, LogLevel.Debug);
        expect(stream?.obj?.level).toEqual('debug');
        expect(stream?.obj?.message).toEqual('text-4-4');
    });

    it('should log with trace level', function () {
        log.t('text-{v}-{l}', 5, LogLevel.Trace);
        expect(stream?.obj?.level).toEqual('trace');
        expect(stream?.obj?.message).toEqual('text-5-5');
    });

    it('should produce simple message', function () {
        log.ll(LogLevel.Error, 'text1');
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual({
            '@timestamp': NowTime,
            context: testContext,
            level: 'error',
            message: 'text1',
        });
    });

    it('should produce message with tokens', function () {
        log.ll(
            LogLevel.Warn,
            'my {name} has {count} times {NaMe} spelled',
            'Przemek',
            15,
            'gwóźdź'
        );
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual({
            '@timestamp': NowTime,
            context: testContext,
            level: 'warn',
            message: 'my Przemek has 15 times gwóźdź spelled',
            name: 'Przemek',
            count: 15,
            NaMe: 'gwóźdź',
        });
    });

    it('should even handle array as scope', function () {
        const subLog = log.scopeTo('arry', ['one', 'two']);
        subLog.e('indexer {n}', 55);
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual({
            '@timestamp': NowTime,
            context: 'arry',
            level: 'error',
            message: 'indexer 55',
            n: 55,
            0: 'one',
            1: 'two',
        });
    });

    it('should not freeze provided scope variable', function () {
        const scope: any = { connection: '445x' };
        const subLog = log.scopeTo('frz', scope);
        subLog.e('ice');
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual({
            '@timestamp': NowTime,
            context: 'frz',
            level: 'error',
            message: 'ice',
            connection: '445x',
        });

        // assign new property to scope
        scope.name = 'testing';
        expect(scope.name).toEqual('testing');

        // new property is not visible in log messages
        subLog.e('snow {speed}m/s', 4);
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual({
            '@timestamp': NowTime,
            context: 'frz',
            level: 'error',
            message: 'snow 4m/s',
            speed: 4,
            connection: '445x',
        });
        expect(stream.obj).not.toEqual(
            jasmine.objectContaining({
                name: 'testing',
            })
        );
    });

    it('should create scope', function () {
        const subLog = log.scopeTo('sub-scope', { connection: '123p' });
        subLog.ll(
            LogLevel.Trace,
            'my {name} has {count} times {NaMe} spelled',
            'Przemek',
            15,
            'gwóźdź'
        );
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual({
            '@timestamp': NowTime,
            context: 'sub-scope',
            level: 'trace',
            message: 'my Przemek has 15 times gwóźdź spelled',
            connection: '123p',
            name: 'Przemek',
            count: 15,
            NaMe: 'gwóźdź',
        });
    });

    it('should create scope within scope and overwrite', function () {
        const subLog = log.scopeTo('sub-scope', { connection: '123p' });
        const subSecondLog = subLog.scopeTo('parser2', {
            connection: 'ope3',
            input: 'hello5',
        });
        subSecondLog.ll(
            LogLevel.Trace,
            'my {name} has {count} times {NaMe} spelled',
            'Przemek',
            15,
            'gwóźdź'
        );
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual({
            '@timestamp': NowTime,
            context: 'parser2',
            level: 'trace',
            message: 'my Przemek has 15 times gwóźdź spelled',
            connection: 'ope3',
            input: 'hello5',
            name: 'Przemek',
            count: 15,
            NaMe: 'gwóźdź',
        });
    });

    it('should create scope within scope and merge parent scope data', function () {
        const subLog = log.scopeTo('sub-scope', { connection: 'aBo8S' });

        subLog.w('data {action} in database', 'updated');
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual({
            '@timestamp': NowTime,
            context: 'sub-scope',
            level: 'warn',
            message: 'data updated in database',
            connection: 'aBo8S',
            action: 'updated',
        });

        const subSecondLog = subLog.scopeTo('parser3', {
            input: 'break7',
        });
        subSecondLog.i(
            'my {name} has {count} times {NaMe} spelled',
            'Przemek',
            15,
            'gwóźdź'
        );
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual({
            '@timestamp': NowTime,
            context: 'parser3',
            level: 'info',
            message: 'my Przemek has 15 times gwóźdź spelled',
            connection: 'aBo8S',
            input: 'break7',
            name: 'Przemek',
            count: 15,
            NaMe: 'gwóźdź',
        });
    });

    it('should overwrite parent scope with child scope', function () {
        const subLog = log.scopeTo('sub-scope', { connection: '123p' });
        const subSecondLog = subLog.scopeTo('parser2', {
            connection: 'ope3',
        });
        subSecondLog.ll(LogLevel.Trace, 'hello');
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual(
            jasmine.objectContaining({
                context: 'parser2',
                connection: 'ope3',
            })
        );
    });

    it('should overwrite scope with log operation fixed fields', function () {
        const subLog = log.scopeTo('sub-scope', { level: 'fish' });
        subLog.ll(LogLevel.Trace, 'hello');
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual(
            jasmine.objectContaining({
                level: 'trace',
                message: 'hello',
            })
        );
    });

    it('should overwrite scope with log operation method arguments', function () {
        const subLog = log.scopeTo('sub-scope', { wheels: 4 });

        subLog.ll(LogLevel.Trace, 'this car has {wheels} wheels', 7);
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual(
            jasmine.objectContaining({
                level: 'trace',
                message: 'this car has 7 wheels',
                wheels: 7,
            })
        );

        subLog.ll(LogLevel.Trace, 'starting {name} car', 'my');
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual(
            jasmine.objectContaining({
                level: 'trace',
                message: 'starting my car',
                wheels: 4,
                name: 'my',
            })
        );
    });

    it('should never overwrite fixed fields', function () {
        const subLog = log.scopeTo('sub-scope', { level: 'fish' });
        subLog.ll(LogLevel.Trace, 'water level is {level}', 'medium');
        expect(stream.obj).toBeTruthy();
        expect(stream.obj).toEqual(
            jasmine.objectContaining({
                level: 'trace',
                message: 'water level is medium',
            })
        );
    });
});
