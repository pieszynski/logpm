#!/bin/bash

# compile
tsc -p tsconfig.json

# test
jasmine --parallel=4 --config=jasmine.json

# prepare for publish
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' -e 's/^export[[:space:]]\{1,\}class[[:space:]]\{1,\}Internals/class Internals/g' dist/logpm.mjs
else
  sed -i -e 's/^export[[:space:]]\{1,\}class[[:space:]]\{1,\}Internals/class Internals/g' dist/logpm.mjs
fi

terser dist/logpm.mjs --compress --mangle --module --compress --output dist/logpm.min.mjs