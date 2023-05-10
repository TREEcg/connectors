import type { IncomingMessage, RequestListener, Server, ServerResponse } from 'http';
import { createServer } from 'http';
import type { Readable } from 'stream';
import { fromDeserializer, SimpleStream } from '@treecg/connector-types';
import type { IStream, IStreamReaderFactory } from '@treecg/connector-types';
import { HTTPConnectorType } from '..';

function streamToString(stream: Readable): Promise<string> {
  const datas = <Buffer[]>[];
  return new Promise(res => {
    stream.on('data', data => {
      datas.push(data);
    });
    stream.on('end', () => res(Buffer.concat(datas).toString()));
  });
}

export interface IHttpReaderConfig {
  host: string;
  port: number;
}

export function startHttpStreamReader<T>(config: IHttpReaderConfig,
  deserializer?: (message: string) => T | PromiseLike<T>): Promise<IStream<T>> {
  const des = fromDeserializer(deserializer);
  let server: Server | undefined;

  const stream = new SimpleStream<T>(() => new Promise(res => {
    const cb = (): void => res();
    if (server !== undefined) {
      server.close(cb);
    } else {
      cb();
    }
  }));

  const requestListener: RequestListener = async function (req: IncomingMessage, res: ServerResponse) {
    try {
      const content = await streamToString(req);
      await stream.push(await des(content));
    } catch (error: unknown) {
      console.error('Failed', error);
    }

    res.writeHead(200);
    res.end('OK');
  };

  server = createServer(requestListener);
  return new Promise(res => {
    const cb = (): void => res(stream);
    server!.listen(config.port, config.host, cb);
  });
}

export class HttpStreamReaderFactory implements IStreamReaderFactory<IHttpReaderConfig> {
  public readonly type = HTTPConnectorType;

  public build<T>(config: IHttpReaderConfig,
    deserializer?: (message: string) => T | PromiseLike<T>): Promise<IStream<T>> {
    return startHttpStreamReader(config, deserializer);
  }
}
