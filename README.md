# dogh

[![NPM](https://nodei.co/npm/dogh.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/dogh/)

[![Build Status](https://travis-ci.org/sehrope/node-dogh.svg?branch=master)](https://travis-ci.org/sehrope/node-dogh)

# Overview
Read text streams line by line with a promisified async/await friendly interface.

* [Install](#install)
* [Usage](#usage)
* [Features](#features)
* [Building and Testing](#building-and-testing)
* [License](#license)

# Install

    $ npm install dogh --save

# Usage
```typescript
import LineReader from 'dogh';

async function main() {
    // Create a LineReader on a readable stream:
    const lr = new LineReader(process.stdin);

    // Read a line of text:
    let line = await lr.readLine();

    // Read all the lines of text:
    while ((line = await lr.readLine()) != null) {
        // Do stuff with line
    }
}
```

# Examples
See [examples](examples/).

# API
## `readLine(): Promise<string>`
Read a line of text from the stream.
Returns a Promise that resolves to the line of text with the newline stripped.
Returns `null` once the end of the stream is reached.
Calling this function again prior to a previous invocation completing will reject with a concurrency error.

# Internals
An event listener is registered for the `data` event of the stream.
Chunks of data, that could be partial lines or multiple lines, are added to an internal list of lines and buffer of remaining partial line text.
The stream is then paused to prevent the internal buffer from growing.

When `readLine()` is called, it first checks to see if the internal list of lines has a buffered line.
If so, a line is removed from that list.
If not, the stream is resumed so that it can continue to buffer lines.
Once at least one line is buffered the stream is again paused to prevent the buffer from growing.

In practice this means you can read a file one line at a time without worrying about blowing up your memory usage.

# Dependencies
None!

# Building and Testing
To build the module run:

    $ make

# License
ISC. See the file [LICENSE](LICENSE).
