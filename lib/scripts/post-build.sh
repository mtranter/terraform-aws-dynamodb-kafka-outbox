#! /usr/bin/env bash

cat > layer/nodejs/node_modules/dynamodb-kafka-outbox/package.json << EOF
{
  "name": "dynamodb-kafka-outbox",
  "version": "1.0.0",
  "description": "",
  "main": "handler.js",
  "scripts": {},
  "keywords": [],
  "author": "",
  "license": "MIT",
  "devDependencies": {},
  "dependencies": {}
}

EOF