import { StreamWriterFactory, Writer } from "@treecg/connector-types";
import { appendFile, writeFile } from "fs/promises";
import { FileConnectorType } from "..";
import { FileReaderConfig } from "./StreamReader";
import { isAbsolute } from "path";

export interface FileWriterConfig extends FileReaderConfig { }

export async function startFileStreamWriter<T>(config: FileWriterConfig, serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
    const ser = serializer || JSON.stringify;
    const path = isAbsolute(config.path) ? config.path : process.cwd() + "/" + config.path;
    const encoding: BufferEncoding = <BufferEncoding>config.encoding || "utf-8";

    if (!config.onReplace) {
        await writeFile(path, "", { encoding })
    }

    const push = async (item: T) => {
        const string = await ser(item);

        if (config.onReplace) {
            await writeFile(path, string, { encoding });
        } else {
            await appendFile(path, string, { encoding });
        }
    };

    return {
        push, disconnect: async () => { }
    }
}


export class FileStreamWriterFactory implements StreamWriterFactory<FileWriterConfig> {
    public readonly type = FileConnectorType;

    build<T>(config: FileWriterConfig, serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
        return startFileStreamWriter(config, serializer);
    }
}
