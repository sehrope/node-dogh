import { DEFAULT_ENCODING } from 'crypto';
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { DEFAULT_ECDH_CURVE } from 'tls';

export type TextEncoding =
    'ascii' |
    'utf8' |
    'utf16le' |
    'ucs2' |
    'latin1'
    ;

export interface ILineReaderOpts {
    encoding: TextEncoding;
}

const DEFAULT_LINE_READER_OPTS: ILineReaderOpts = {
    encoding: 'utf8',
};

function chomp(line: string): string {
    if (!line) {
        return '';
    }
    const last = line[line.length - 1];
    if (last === '\r') {
        return line.substring(0, line.length - 1);
    }
    return line;
}

export default class LineReader {
    private readonly data: Readable;
    private lines: string[] = [];
    private buffer: string = '';
    private err: Error;
    private events: EventEmitter;
    private reading: boolean = false;

    constructor(data: Readable, opts?: ILineReaderOpts) {
        const encoding = (opts ? opts.encoding : null) || DEFAULT_LINE_READER_OPTS.encoding;
        this.events = new EventEmitter();
        this.data = data;
        this.data.setEncoding(encoding);
        this.data.on('data', (chunk) => {
            let found = false;
            const count = this.lines.length;
            for (const c of chunk) {
                if (c === '\n') {
                    this.lines.push(chomp(this.buffer));
                    this.buffer = '';
                    found = true;
                } else {
                    this.buffer += c;
                }
            }
            if (found) {
                this.events.emit('data');
            }
        });
        this.data.on('end', () => {
            if (this.buffer.length > 0) {
                // Add whatever is left on the buffer as a new line
                this.lines.push(chomp(this.buffer));
            }
            this.buffer = null;
            this.events.emit('data');
        });
        this.data.on('error', (err) => {
            this.err = err;
            this.events.emit('data');
        });
        this.data.pause();
    }

    /**
     * Reads a line of text from the stream.
     */
    public readLine(): Promise<string> {
        if (this.reading) {
            return Promise.reject(new Error('A read operation is already in progress'));
        }
        if (this.lines.length > 0) {
            return Promise.resolve(this.lines.shift());
        }
        if (this.err) {
            return Promise.reject(this.err);
        }
        if (this.buffer === null) {
            return Promise.resolve(null);
        }
        this.reading = true;
        return new Promise<string>((resolve, reject) => {
            const onData = () => {
                this.reading = false;
                if (this.buffer != null) {
                    this.data.pause();
                }
                const line = this.lines.shift();
                if (line !== undefined) {
                    resolve(line);
                    return;
                }
                if (this.err) {
                    reject(this.err);
                    return;
                }
                resolve(null);
            };
            this.events.once('data', onData);
            this.data.resume();
        });
    }

    /**
     * Read and discard some lines of input.
     *
     * @param count Number of lines to skip
     * @returns The number of lines that were skipped which may be less than requested if the end of file is reached.
     */
    public async skip(count: number): Promise<number> {
        let i;
        for (i = 0; i < count; i++) {
            const line = await this.readLine();
            if (line == null) {
                break;
            }
        }
        return i;
    }
}
