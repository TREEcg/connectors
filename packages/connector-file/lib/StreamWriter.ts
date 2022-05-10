import { StreamWriterFactory, Writer } from "@treecg/connector-types";
import { appendFile, writeFile } from "fs/promises";
import { FileReaderConfig } from "./StreamReader";

export interface FileWriterConfig extends FileReaderConfig { }

export async function startFileStreamWriter<T>(config: FileWriterConfig, serializer?: (item: T) => string): Promise<Writer<T>> {
    const ser = serializer || JSON.stringify;
    const encoding: BufferEncoding = <BufferEncoding>config.encoding || "utf-8";

    if (!config.onReplace) {
        await writeFile(config.path, "", { encoding })
    }

    const push = async (item: T) => {
        const string = ser(item);

        if (config.onReplace) {
            await writeFile(config.path, string, { encoding });
        } else {
            await appendFile(config.path, string, { encoding });
        }
    };

    return {
        push, disconnect: async () => { }
    }
}


export class FileStreamWriterFactory implements StreamWriterFactory<FileWriterConfig> {
    public readonly type = "file";

    build<T>(config: FileWriterConfig, serializer?: (item: T) => string): Promise<Writer<T>> {
        return startFileStreamWriter(config, serializer);
    }
}
