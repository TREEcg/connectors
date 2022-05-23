
import { SimpleStream, Stream, StreamReaderFactory } from "@treecg/connector-types";
import { createReadStream } from 'fs';
import { open, readFile, stat, watch } from "fs/promises";
import { isAbsolute } from "path";
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
    const des = deserializer || JSON.parse;
    const path = isAbsolute(config.path) ? config.path : process.cwd() + "/" + config.path;
    const encoding: BufferEncoding = <BufferEncoding>config.encoding || "utf-8";

    await makeSureFileExists(path);

    let currentPos = await getFileSize(path);

    const ac = new AbortController();
    const { signal } = ac;
    const out = new SimpleStream<T>(async () => ac.abort());


    (async () => {
        if (config.onReplace && config.readFirstContent) {
            console.log("reading first content")
            const content = await readFile(path, { encoding });
            out.push(des(content));
        }

        try {
            const watcher = watch(path, { signal });
            for await (const event of watcher) {
                if (event.eventType === "change") {

                    let content: string;
                    if (config.onReplace) {
                        content = await readFile(path, { encoding });
                    } else {
                        const newSize = await getFileSize(path);

                        if (newSize <= currentPos) {
                            currentPos = newSize;
                            continue;
                        }

                        content = await readPart(path, currentPos, newSize, encoding);
                        currentPos = newSize;
                    }

                    out.push(des(content));
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError')
                return;
            throw err;
        }
    })();

    return out;
}


export class FileStreamReaderFactory implements StreamReaderFactory<FileReaderConfig> {
    public readonly type = FileConnectorType;

    build<T>(config: FileReaderConfig, deserializer?: (message: string) => T): Promise<Stream<T>> {
        return startFileStreamReader(config, deserializer);
    }
}
