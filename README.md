# logpm

Semantic Logging in JavaScript

## How to use

```js
import { Logger, LogLevel } from "logpm";

const logger = new Logger("main");

// log with information level:
//
//  * logger.ll(LogLevel.Info, ...) or
//  * logger.i(...)
logger.ll(LogLevel.Info, "hello {name}, how are you?", "Przemek");

const scopedLogger = logger.scopeTo("middleware", {
  connectionId: "ASDF443",
  username: "admin5",
});

// log with trace/verbose level
scopedLogger.t("User connected");
scopedLogger.t("Action {action} started", "buy");
```

gives console output of

```text
{"@timestamp":"2024-06-16T11:31:27.518Z","context":"main","level":"info","message":"hello Przemek, how are you?","name":"Przemek"}
{"@timestamp":"2024-06-16T11:31:27.523Z","context":"middleware","level":"trace","message":"User connected","connectionId":"ASDF443","username":"admin5"}
{"@timestamp":"2024-06-16T11:31:27.524Z","context":"middleware","level":"trace","message":"Action buy started","connectionId":"ASDF443","username":"admin5","action":"buy"}
```

## Constructor

Parameters:

- `context` - (required) Name the context where operations are logged. Required type: _string_
- `scope` - (optional) Common scope object for all logged messages
- `timeProvider` - (optional/advanced) Leave null for default behavior or provide custom way to assign timestamps
- `stream` - (optional/advanced) Leave null for default behavior or pass custom nonblocking stream. Async operations are not supported and not desired

## Available methods

- `Logger.e` - log with error level
- `Logger.w` - log with warning level
- `Logger.i` - log with information level
- `Logger.d` - log with debug level
- `Logger.t` - log with trace/verbose level
- `Logger.ll` - log with level provided as parameter
- `Logger.scopeTo` - create sub context logger for specific task (context). If provided, scope will merge with existing scope

## Design decisions

- **No log level filtering**. All messages are important, some less some more. It is log forwarder's role to push them, and indexing engine to forget selected types - some sooner, other later and a few maybe never. Log level switching is cool but will not help answer questions like "_What happened yesterday at 17:46?_"
- **Scope and variable merging**. Child scope values, when using `.scopeTo` or even during simple message logging may seem to be overwriten during log writing operations but this does not change the internally saved scopes inside logger instance. For now the order is as follows:
  - parent scope
  - child scope
  - variables read from log operation
  - log operation's key fields `@timestamp`, `context`, `level`, `message`. These will never be overwitten.
