#!/bin/bash
[[ -d publish ]] || mkdir publish

cp ../README.md publish/
cp ../LICENSE.txt publish/
cp package.json publish/
cp dist/logpm.min.mjs publish/
cp dist/logpm.mjs publish/
cp dist/logpm.d.mts publish/