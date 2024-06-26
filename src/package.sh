#!/bin/bash
[[ -d publish ]] || mkdir publish

cp ../README.md publish/
cp ../LICENSE.txt publish/
cp package.json publish/
cp dist/logpm.min.mjs publish/
cp dist/logpm.mjs publish/
cp dist/logpm.d.mts publish/

if [[ ! -z "$PM_VERSION" ]]; then
  SEM_VERSION=$(echo -n "$PM_VERSION" | sed -e 's/.*\([0-9]\{1,\}\.[0-9]\{1,\}\.[0-9]\{1,\}\).*/\1/')
  echo "Setting version overwrite: '$SEM_VERSION'"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' -e "s/\"version\": \"1.2.7\"/\"version\": \"$SEM_VERSION\"/g" publish/package.json
  else
    sed -i -e "s/\"version\": \"1.2.7\"/\"version\": \"$SEM_VERSION\"/g" publish/package.json
  fi
else
  echo "No version overwrite, using file package.json as is"
fi
