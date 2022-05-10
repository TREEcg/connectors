import { FileReaderConfig, FileStreamReaderFactory } from "@treecg/connector-file/lib/StreamReader";
import { FileStreamWriterFactory, FileWriterConfig } from "@treecg/connector-file/lib/StreamWriter";
import { KafkaReaderConfig, KafkaStreamReaderFactory, KafkaStreamWriterFactory, KafkaWriterConfig } from "@treecg/connector-kafka";
import { ReaderFactory, StreamReaderFactory, StreamWriterFactory, Typed, WriterFactory } from "@treecg/connector-types";
import { WsReaderConfig, WsStreamReaderFactory, WsStreamWriterFactory, WsWriterConfig } from "@treecg/connector-ws";

export type Config = (KafkaReaderConfig & KafkaWriterConfig) | (WsReaderConfig & WsWriterConfig) | (FileReaderConfig & FileWriterConfig);

export class AllReaderFactory extends ReaderFactory<Config> {
    constructor() {
        super(
            <StreamReaderFactory<Config>[]>[new KafkaStreamReaderFactory(), new WsStreamReaderFactory(), new FileStreamReaderFactory()]
        )
    }
}

export class AllWriterFactory extends WriterFactory<Config> {
    constructor() {
        super(
            <StreamWriterFactory<Config>[]>[new KafkaStreamWriterFactory(), new WsStreamWriterFactory(), new FileStreamWriterFactory()]
        )
    }
}

function sleep(mills: number): Promise<void> {
    return new Promise(res => setTimeout(res, mills));
}

export async function main() {
    const writerFactory = new AllWriterFactory();
    const readerFactory = new AllReaderFactory();

    const fileConfig: Typed<Config> = {
        type: "file",
        config: {
            path: "metadata.json",
            onReplace: true,
            readFirstContent: true
        }
    };

    const wsConfig: Typed<Config> = {
        type: "ws",
        config: {
            host: "localhost",
            port: 8000,
            url: "ws://localhost:8000"
        }
    };

    const configs = { data: wsConfig, metadata: fileConfig };

    const allReader = await readerFactory.buildReader(configs);

    allReader.data.data(data => console.log("Got data", data));
    allReader.metadata.data(data => console.log("Got metadata", data));

    const allWriter = await writerFactory.buildReader(configs);

    await allWriter.data.push("data");
    await sleep(500);

    await allWriter.data.push("more data");
    await sleep(500);

    await allWriter.metadata.push("metadata changed!")
    await allWriter.data.push(1);
    await sleep(500);

    await allWriter.data.push(2);
}