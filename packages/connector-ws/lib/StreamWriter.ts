import type { IStreamWriterFactory, IWriter } from '@treecg/connector-types';
import { fromSerializer } from '@treecg/connector-types';
import { WebSocket } from 'ws';
import { WSConnectorType } from '..';

export interface IWsWriterConfig {
  url: string;
}

function _connectWs(url: string, res: (value: WebSocket) => void): void {
  const ws = new WebSocket(url, {});
  ws.on('error', () => {
    setTimeout(
      () =>
        _connectWs(url, res),
      300,
    );
  });

  ws.on('ping', () => ws.pong());
  ws.on('open', () => res(ws));
}

function connectWs(url: string): Promise<WebSocket> {
  return new Promise(res => _connectWs(url, res));
}

export async function startWsStreamWriter<T>(config: IWsWriterConfig,
  serializer?: (item: T) => string | PromiseLike<string>): Promise<IWriter<T>> {
  const ser = fromSerializer(serializer);
  const ws = await connectWs(config.url);

  const push = async (item: T): Promise<void> => {
    const msg = await ser(item);
    await new Promise<void>(res => ws.send(msg, () => res()));
  };

  const disconnect = async (): Promise<void> => {
    ws.close();
  };

  return { push, disconnect };
}

export class WsStreamWriterFactory implements IStreamWriterFactory<IWsWriterConfig> {
  public readonly type = WSConnectorType;

  public build<T>(config: IWsWriterConfig,
    serializer?: (item: T) => string | PromiseLike<string>): Promise<IWriter<T>> {
    return startWsStreamWriter(config, serializer);
  }
}
