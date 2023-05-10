import type { IStream, IStreamReaderFactory } from '@treecg/connector-types';
import { fromDeserializer, SimpleStream } from '@treecg/connector-types';
import type { RawData, WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { WSConnectorType } from '..';

export interface IWsReaderConfig {
  host: string;
  port: number;
}

export async function startWsStreamReader<T>(config: IWsReaderConfig,
  deserializer?: (message: string) => T | PromiseLike<T>): Promise<IStream<T>> {
  const des = fromDeserializer(deserializer);
  const server = new WebSocketServer(config);
  server.on('error', error => {
    console.error('Ws server error:');
    console.error(error);
  });

  const connections: { socket: WebSocket; alive: boolean }[] = [];

  const interval = setInterval(() => {
    connections.forEach((instance, i) => {
      if (!instance) {
        return;
      }
      if (!instance.alive) {
        instance.socket.terminate();
        delete connections[i];

        return;
      }

      instance.socket.ping();
      instance.alive = false;
    });
  }, 30_000);

  const stream = new SimpleStream<T>(() => new Promise(res => {
    clearInterval(interval);
    server.close(() => res());
  }));

  server.on('connection', ws => {
    const instance = { socket: ws, alive: true };
    connections.push(instance);

    ws.on('message', async (msg: RawData, isBinary: boolean) => {
      const item = await des(msg.toString());
      await stream.push(item);
    });

    ws.on('pong', () => {
      instance.alive = true;
    });
  });

  return stream;
}

export class WsStreamReaderFactory implements IStreamReaderFactory<IWsReaderConfig> {
  public readonly type = WSConnectorType;

  public build<T>(config: IWsReaderConfig,
    deserializer?: (message: string) => T | PromiseLike<T>): Promise<IStream<T>> {
    return startWsStreamReader(config, deserializer);
  }
}
