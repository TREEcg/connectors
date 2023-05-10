import type * as RDF from '@rdfjs/types';
import { OutputRepresentation } from '@treecg/actor-init-ldes-client';
import type { LDESClient } from '@treecg/actor-init-ldes-client';
import { SimpleStream } from '@treecg/connector-types';
import type { IStream } from '@treecg/connector-types';

interface ILDESItem {
  'type': 'data' | 'metadata';
  'data': RDF.Quad[];
}

export interface ILDESReaderConfig {
  client: LDESClient;
  _init: any;
  url: string;
}

export async function startLDESStreamReader(config: ILDESReaderConfig): Promise<IStream<ILDESItem>> {
  const stream = config.client.createReadStream(config.url, { representation: OutputRepresentation.Quads });
  const out = new SimpleStream<ILDESItem>(async () => {
    stream.emit('close');
  });

  stream.on('data', member => {
    out.push({ type: 'data', data: member })
      .catch(error => {
        throw error;
      });
  });

  stream.on('metadata', member => {
    out.push({ type: 'metadata', data: member })
      .catch(error => {
        throw error;
      });
  });

  stream.emit('close');

  stream.on('end', () => {
    out.end()
      .catch(error => {
        throw error;
      });
  });

  return out;
}

export class StreamReader {
  private readonly config: ILDESReaderConfig;
  public constructor(client: LDESClient, _init: any, url: string) {
    this.config = { client, _init, url };
  }

  public stream(): Promise<IStream<ILDESItem>> {
    return startLDESStreamReader(this.config);
  }
}
