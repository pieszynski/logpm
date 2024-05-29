# logpm

Semantic Logging in JavaScript

## How to use

```js
import { Logger, LogLevel } from "logpm";

const logger = new Logger("main");

logger.ll(LogLevel.Info, "hello {name}, how are you?", "Przemek");
```

gives console output of

```text
{"@timestamp":"2024-05-31T15:21:29.788Z","context":"main","level":"info","message":"hello Przemek, how are you?","name":"Przemek"}
```
