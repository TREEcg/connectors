import { createReadStream } from "fs";
import { open, readFile, stat } from "fs/promises";
import { isAbsolute } from "path";
import { fromDeserializer, SimpleStream } from "@treecg/connector-types";
import type { Stream, StreamReaderFactory } from "@treecg/connector-types";
import Watcher from "watcher";
import { FileConnectorType } from "..";

interface FileError extends Error {
    code: string;
}

export interface FileReaderConfig {
    path: string;
    onReplace: boolean;
    readFirstContent?: boolean;
    encoding?: string;
}

async function makeSureFileExists(path: string): Promise<void> {
    const handle = await open(path, "a+");
    handle.close().catch(error => {
        throw error;
    });
}

async function getFileSize(path: string): Promise<number> {
    return (await stat(path)).size;
}

function readPart(path: string, start: number, end: number, encoding: BufferEncoding): Promise<string> {
    return new Promise(res => {
        const stream = createReadStream(path, { encoding, start, end });
        let buffer = "";
        stream.on("data", chunk => {
            buffer += chunk;
        });
        stream.on("close", () => res(buffer));
    });
}

export async function startFileStreamReader<T>(
    config: FileReaderConfig,
    deserializer?: (message: string) => T | PromiseLike<T>,
): Promise<Stream<T>> {
    const des = fromDeserializer(deserializer);
    const path = isAbsolute(config.path) ? config.path : `${process.cwd()}/${config.path}`;
    const encoding: BufferEncoding = <BufferEncoding>config.encoding || "utf-8";

    await makeSureFileExists(path);

    let currentPos = await getFileSize(path);

    const watcher = new Watcher(path, { debounce: 100 });
    const out = new SimpleStream<T>(async () => {
        watcher.close();
    });

    watcher.on("change", async filePath => {
        try {
            let content: string;
            if (config.onReplace) {
                content = await readFile(filePath, { encoding });
            } else {
                const newSize = await getFileSize(filePath);

                if (newSize <= currentPos) {
                    currentPos = newSize;
                    return;
                }

                content = await readPart(filePath, currentPos, newSize, encoding);
                currentPos = newSize;
            }

            out.push(await des(content)).catch(error => {
                throw error;
            });
        } catch (error: unknown) {
            if ((<FileError>error).code === "ENOENT") {
                return;
            }
            throw error;
        }
    });

    await Promise.all([
        new Promise(res => watcher.on("add", res)),
        new Promise(res => watcher.on("ready", res)),
    ]);

    if (config.onReplace && config.readFirstContent) {
        console.log("reading first content");
        const content = await readFile(path, { encoding });
        out.push(await des(content)).catch(error => {
            throw error;
        });
    }

    return out;
}

export class FileStreamReaderFactory implements StreamReaderFactory<FileReaderConfig> {
    public readonly type = FileConnectorType;

    public build<T>(config: FileReaderConfig,
        deserializer?: (message: string) => T | PromiseLike<T>): Promise<Stream<T>> {
        return startFileStreamReader(config, deserializer);
    }
}

