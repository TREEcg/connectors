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

