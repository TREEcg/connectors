
import { SimpleStream, Stream, StreamReaderFactory } from "@treecg/connector-types";
import { createReadStream } from 'fs';
import { open, readFile, stat } from "fs/promises";
import { isAbsolute } from "path";
import Watcher from 'watcher';
import { FileConnectorType } from "..";

export interface FileReaderConfig {
    path: string,
    onReplace: boolean,
    readFirstContent?: boolean,
    encoding?: string,
}

async function makeSureFileExists(path: string) {
    const handle = await open(path, "a+",);
    handle.close();
}

async function getFileSize(path: string) {
    return (await stat(path)).size;
}

function readPart(path: string, start: number, end: number, encoding: BufferEncoding): Promise<string> {
    return new Promise(res => {
        const stream = createReadStream(path, { encoding, start, end });
        let buffer = "";
        stream.on("data", chunk => buffer += chunk);
        stream.on("close", () => res(buffer));
    });
}

export async function startFileStreamReader<T>(
    config: FileReaderConfig,
    deserializer?: (message: string) => T
): Promise<Stream<T>> {
    const des = deserializer || (x => <T><unknown>x);
    const path = isAbsolute(config.path) ? config.path : process.cwd() + "/" + config.path;
    const encoding: BufferEncoding = <BufferEncoding>config.encoding || "utf-8";

    await makeSureFileExists(path);

    let currentPos = await getFileSize(path);

    const watcher = new Watcher(path, { debounce: 100 });
    const out = new SimpleStream<T>(async () => { watcher.close() });

    watcher.on("change", async path => {
        try {
            let content: string;
            if (config.onReplace) {
                content = await readFile(path, { encoding });
            } else {
                const newSize = await getFileSize(path);

                if (newSize <= currentPos) {
                    currentPos = newSize;
                    return;
                }

                content = await readPart(path, currentPos, newSize, encoding);
                currentPos = newSize;
            }

            out.push(des(content));
        } catch (err: any) {
            if (err.code === "ENOENT") return;
            throw err;
        }
    });


    await Promise.all([
        new Promise(res => watcher.on("add", res)),
        new Promise(res => watcher.on("ready", res)),
    ]);

    if (config.onReplace && config.readFirstContent) {
        console.log("reading first content")
        const content = await readFile(path, { encoding });
        out.push(des(content));
    }

    return out;
}


export class FileStreamReaderFactory implements StreamReaderFactory<FileReaderConfig> {
    public readonly type = FileConnectorType;

    build<T>(config: FileReaderConfig, deserializer?: (message: string) => T): Promise<Stream<T>> {
        return startFileStreamReader(config, deserializer);
    }
}

