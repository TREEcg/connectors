import type { StreamWriterFactory, Writer } from "@treecg/connector-types";
import { fromSerializer } from "@treecg/connector-types";
import { WebSocket } from "ws";
import { WSConnectorType } from "..";

export interface WsWriterConfig {
    url: string;
}

function _connectWs(url: string, res: (value: WebSocket) => void): void {
    const ws = new WebSocket(url, {});
    ws.on("error", () => {
        setTimeout(
            () =>
                _connectWs(url, res),
            300,
        );
    });

    ws.on("ping", () => ws.pong());
    ws.on("open", () => res(ws));
}

function connectWs(url: string): Promise<WebSocket> {
    return new Promise(res => _connectWs(url, res));
}

export async function startWsStreamWriter<T>(config: WsWriterConfig,
    serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
    const ser = fromSerializer(serializer);
    const ws = await connectWs(config.url);

    const push = async (item: T): Promise<void> => {
        const msg = await ser(item);
        await new Promise<void>(res => ws.send(msg, () => res()));
    };

    const end = async (): Promise<void> => {
        ws.close();
    };

    return { push, end };
}

export class WsStreamWriterFactory implements StreamWriterFactory<WsWriterConfig> {
    public readonly type = WSConnectorType;

    public build<T>(config: WsWriterConfig,
        serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
        return startWsStreamWriter(config, serializer);
    }
}
