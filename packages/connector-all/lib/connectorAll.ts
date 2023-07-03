import type * as rdf from "@rdfjs/types";
import type { FileReaderConfig } from "@treecg/connector-file/lib/StreamReader";
import { FileStreamReaderFactory } from "@treecg/connector-file/lib/StreamReader";
import type { FileWriterConfig } from "@treecg/connector-file/lib/StreamWriter";
import { FileStreamWriterFactory } from "@treecg/connector-file/lib/StreamWriter";
import type { HttpReaderConfig, HttpWriterConfig } from "@treecg/connector-http";
import { HttpStreamReaderFactory, HttpStreamWriterFactory } from "@treecg/connector-http";
import type { KafkaReaderConfig, KafkaWriterConfig } from "@treecg/connector-kafka";
import { KafkaStreamReaderFactory, KafkaStreamWriterFactory } from "@treecg/connector-kafka";
import type { StreamReaderFactory, StreamWriterFactory } from "@treecg/connector-types";
import { ReaderFactory, WriterFactory } from "@treecg/connector-types";
import type { WsReaderConfig, WsWriterConfig } from "@treecg/connector-ws";
import { WsStreamReaderFactory, WsStreamWriterFactory } from "@treecg/connector-ws";

export * from "./readers";
export * from "./writers";
export * from "./voc";

export { FileReaderConfig, FileStreamReaderFactory } from "@treecg/connector-file/lib/StreamReader";
export { FileStreamWriterFactory, FileWriterConfig } from "@treecg/connector-file/lib/StreamWriter";
export {
    KafkaReaderConfig,
    KafkaStreamReaderFactory,
    KafkaStreamWriterFactory,
    KafkaWriterConfig,
} from "@treecg/connector-kafka";
export { ReaderFactory, StreamReaderFactory, StreamWriterFactory, WriterFactory } from "@treecg/connector-types";
export { WsReaderConfig, WsStreamReaderFactory, WsStreamWriterFactory, WsWriterConfig } from "@treecg/connector-ws";
export {
    HttpReaderConfig,
    HttpStreamReaderFactory,
    HttpStreamWriterFactory,
    HttpWriterConfig,
} from "@treecg/connector-http";

export type ReaderConfig = KafkaReaderConfig | WsReaderConfig | FileReaderConfig | HttpReaderConfig;
export type WriterConfig = KafkaWriterConfig | WsWriterConfig | FileWriterConfig | HttpWriterConfig;

export type Config = (KafkaReaderConfig & KafkaWriterConfig)
| (WsReaderConfig & WsWriterConfig)
| (FileReaderConfig & FileWriterConfig)
| (HttpReaderConfig & HttpWriterConfig);

export class AllReaderFactory extends ReaderFactory<ReaderConfig> {
    public constructor() {
        super(
            <StreamReaderFactory<ReaderConfig>[]>[
                new KafkaStreamReaderFactory(),
                new WsStreamReaderFactory(),
                new FileStreamReaderFactory(),
                new HttpStreamReaderFactory(),
            ],
        );
    }
}

export class AllWriterFactory extends WriterFactory<WriterConfig> {
    public constructor() {
        super(
            <StreamWriterFactory<WriterConfig>[]>[
                new KafkaStreamWriterFactory(),
                new WsStreamWriterFactory(),
                new FileStreamWriterFactory(),
                new HttpStreamWriterFactory(),
            ],
        );
    }
}

export type MatchFunction = (
    s: rdf.Term | undefined | null,
    p: rdf.Term | undefined | null,
    o: rdf.Term | undefined | null) => Promise<rdf.Quad[]>;

export type MatchFunctionObject = (
    s: rdf.Term | undefined | null,
    p: rdf.Term | undefined | null,
    o: rdf.Term | undefined | null) => Promise<rdf.Term[]>;

export function storeMatcher(store: rdf.Store): MatchFunction {
    return (subject, predicate, object) => {
        const buffer: rdf.Quad[] = [];
        return new Promise(res => {
            const it = store.match(subject, predicate, object);
            it.on("data", data => buffer.push(data));
            it.on("end", () => res(buffer));
        });
    };
}

