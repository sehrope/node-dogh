import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import * as stream from 'stream';
import LineReader from '../lib';

async function readAndCompare(data: stream.Readable, expectedLines: string[]) {
    const lr = new LineReader(data);
    let line;
    let count = 0;
    while ((line = await lr.readLine()) != null) {
        const index = count;
        const expectedLine = expectedLines[index];
        assert.equal(line, expectedLine, `Line number ${index} should match`);
        count += 1;
    }
    assert.equal(count, expectedLines.length, 'The total number of lines should match');
}

function createStream(...data: string[]) {
    const ret = new stream.PassThrough();
    ret.end(new Buffer(data.join('')));
    return ret;
}

describe('A LineReader', () => {
    it('should read a stream with one line of text', () => {
        return readAndCompare(
            createStream(
                'This is a test\n',
            ), [
                'This is a test',
            ]);
    });

    it('should read a stream with multiple lines of text', () => {
        return readAndCompare(
            createStream(
                'This is a test\n',
                'Testing\n',
                'Foo Bar Baz Bam\n'
            ), [
                'This is a test',
                'Testing',
                'Foo Bar Baz Bam',
            ]);
    });


    it('should read a stream with multiple lines of text with CRLF', () => {
        return readAndCompare(
            createStream(
                'This is a test\r\n',
                'Testing\r\n',
                'Foo Bar Baz Bam\r\n'
            ), [
                'This is a test',
                'Testing',
                'Foo Bar Baz Bam',
            ]);
    });

    it('should read a stream with multiple lines of text without a trailing newline', () => {
        return readAndCompare(
            createStream(
                'This is a test\n',
                'Testing\n',
                'Foo Bar Baz Bam'
            ), [
                'This is a test',
                'Testing',
                'Foo Bar Baz Bam',
            ]);
    });

    it('should reject with an error if the stream has an error', async () => {
        const bad = new stream.PassThrough();
        bad.write(new Buffer('test\n'));
        const err = new Error('Ruh-roh!')

        const lr = new LineReader(bad);
        setTimeout(() => {
            bad.emit('error', err);
        }, 10);
        try {
            // NOTE: We need to read through the lines as the error could come at any time
            while ((await lr.readLine()) != null) {
                // ignore
            }
            assert.fail('Expected an error');
        } catch (e) {
            assert(e === err);
        }
    });

    it('should reject with an error if a concurrent readLine() is in progress', async () => {
        const data = createStream(
            'This is a test\n',
            'Testing\n',
            'Foo Bar Baz Bam'
        );
        const lr = new LineReader(data);
        let pLine;
        try {
            pLine = lr.readLine();
            const otherLine = await lr.readLine();
            assert.fail('Expected an error');
        } catch (e) {
            const line = await pLine;
            assert.equal(line, 'This is a test');
        }
    });
});
