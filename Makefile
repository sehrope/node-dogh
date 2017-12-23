default: clean compile

deps:
	rm -rf node_modules
	npm install

clean:
	rm -rf lib

compile:
	node_modules/.bin/tsc --project tsconfig.json --declaration

watch:
	node_modules/.bin/tsc --watch --declaration

lint:
	node_modules/.bin/tslint --project tsconfig.json

test:
	node_modules/.bin/mocha test/*.ts

package: clean deps compile

publish: package test
	npm publish

.PHONY: default deps clean compile lint test watch package publish
