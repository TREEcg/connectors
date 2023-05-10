import type * as rdf from '@rdfjs/types';
import type { IFileReaderConfig } from '@treecg/connector-file/lib/StreamReader';
import { FileStreamReaderFactory } from '@treecg/connector-file/lib/StreamReader';
import type { IFileWriterConfig } from '@treecg/connector-file/lib/StreamWriter';
import { FileStreamWriterFactory } from '@treecg/connector-file/lib/StreamWriter';
import type { IHttpReaderConfig, IHttpWriterConfig } from '@treecg/connector-http';
import { HttpStreamReaderFactory, HttpStreamWriterFactory } from '@treecg/connector-http';
import type { IKafkaReaderConfig, IKafkaWriterConfig } from '@treecg/connector-kafka';
import { KafkaStreamReaderFactory, KafkaStreamWriterFactory } from '@treecg/connector-kafka';
import type { IStreamReaderFactory, IStreamWriterFactory } from '@treecg/connector-types';
import { ReaderFactory, WriterFactory } from '@treecg/connector-types';
import type { IWsReaderConfig, IWsWriterConfig } from '@treecg/connector-ws';
import { WsStreamReaderFactory, WsStreamWriterFactory } from '@treecg/connector-ws';

export * from './readers';
export * from './writers';
export * from './voc';

export { IFileReaderConfig, FileStreamReaderFactory } from '@treecg/connector-file/lib/StreamReader';
export { FileStreamWriterFactory, IFileWriterConfig } from '@treecg/connector-file/lib/StreamWriter';
export {
  IKafkaReaderConfig,
  KafkaStreamReaderFactory,
  KafkaStreamWriterFactory,
  IKafkaWriterConfig,
} from '@treecg/connector-kafka';
export { ReaderFactory, IStreamReaderFactory, IStreamWriterFactory, WriterFactory } from '@treecg/connector-types';
export { IWsReaderConfig, WsStreamReaderFactory, WsStreamWriterFactory, IWsWriterConfig } from '@treecg/connector-ws';
export {
  IHttpReaderConfig,
  HttpStreamReaderFactory,
  HttpStreamWriterFactory,
  IHttpWriterConfig,
} from '@treecg/connector-http';

export type ReaderConfig = IKafkaReaderConfig | IWsReaderConfig | IFileReaderConfig | IHttpReaderConfig;
export type WriterConfig = IKafkaWriterConfig | IWsWriterConfig | IFileWriterConfig | IHttpWriterConfig;

export type Config =
  (IKafkaReaderConfig & IKafkaWriterConfig)
  | (IWsReaderConfig & IWsWriterConfig)
  | (IFileReaderConfig & IFileWriterConfig)
  | (IHttpReaderConfig & IHttpWriterConfig);

export class AllReaderFactory extends ReaderFactory<ReaderConfig> {
  public constructor() {
    super(
      <IStreamReaderFactory<ReaderConfig>[]>[
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
      <IStreamWriterFactory<WriterConfig>[]>[
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
  o: rdf.Term | undefined | null
) => Promise<rdf.Quad[]>;

export type MatchFunctionObject = (
  s: rdf.Term | undefined | null,
  p: rdf.Term | undefined | null,
  o: rdf.Term | undefined | null
) => Promise<rdf.Term[]>;

export function storeMatcher(store: rdf.Store): MatchFunction {
  return (subject, predicate, object) => {
    const buffer: rdf.Quad[] = [];
    return new Promise(res => {
      const it = store.match(subject, predicate, object);
      it.on('data', data => buffer.push(data));
      it.on('end', () => res(buffer));
    });
  };
}

