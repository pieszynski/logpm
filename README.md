# logpm

Semantic Logging in JavaScript

## How to use

```js
import { Logger, LogLevel } from "logpm";

const logger = new Logger("main");

logger.ll(LogLevel.Info, "hello {name}, how are you?", "Przemek");

const scopedLogger = logger.scopeTo("middleware", {
  connectionId: "ASDF443",
  username: "admin5",
});

scopedLogger.ll(LogLevel.Trace, "User connected");
scopedLogger.ll(LogLevel.Trace, "Action {action} started", "buy");
```

gives console output of

```text
{"@timestamp":"2024-06-16T11:31:27.518Z","context":"main","level":"info","message":"hello Przemek, how are you?","name":"Przemek"}
{"@timestamp":"2024-06-16T11:31:27.523Z","context":"middleware","level":"trace","message":"User connected","connectionId":"ASDF443","username":"admin5"}
{"@timestamp":"2024-06-16T11:31:27.524Z","context":"middleware","level":"trace","message":"Action buy started","connectionId":"ASDF443","username":"admin5","action":"buy"}
```
