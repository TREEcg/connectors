import { appendFile, writeFile } from "fs/promises";
import { isAbsolute } from "path";
import type { StreamWriterFactory, Writer } from "@treecg/connector-types";
import { fromSerializer } from "@treecg/connector-types";
import { FileConnectorType } from "..";
import type { FileReaderConfig } from "./StreamReader";

export type FileWriterConfig = FileReaderConfig

export async function startFileStreamWriter<T>(config: FileWriterConfig,
    serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
    const ser = fromSerializer(serializer);
    const path = isAbsolute(config.path) ? config.path : `${process.cwd()}/${config.path}`;
    const encoding: BufferEncoding = <BufferEncoding>config.encoding || "utf-8";

    if (!config.onReplace) {
        await writeFile(path, "", { encoding });
    }

    const push = async (item: T): Promise<void> => {
        const string = await ser(item);

        if (config.onReplace) {
            await writeFile(path, string, { encoding });
        } else {
            await appendFile(path, string, { encoding });
        }
    };

    const end = async (): Promise<void> => {

    };

    return {
        push, end
    };
}

export class FileStreamWriterFactory implements StreamWriterFactory<FileWriterConfig> {
    public readonly type = FileConnectorType;

    public build<T>(config: FileWriterConfig,
        serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
        return startFileStreamWriter(config, serializer);
    }
}
