import { SimpleStream, Stream, StreamReaderFactory } from "@treecg/connector-types";
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { WSConnectorType } from "..";

export interface WsReaderConfig {
    host: string,
    port: number,
}

export async function startWsStreamReader<T>(config: WsReaderConfig, deserializer?: (message: string) => T | PromiseLike<T>): Promise<Stream<T>> {
    const des = deserializer || JSON.parse;
    const server = new WebSocketServer(config);
    server.on("error", (e) => {
        console.error("Ws server error:")
        console.error(e);
    });

    const connections: { socket: WebSocket, alive: boolean }[] = [];

    const interval = setInterval(() => {
        connections.forEach((instance, i) => {
            if (!instance) return;
            if (!instance.alive) {
                instance.socket.terminate();
                delete connections[i];

                return;
            }

            instance.socket.ping();
            instance.alive = false;
        });
    }, 30000);

    const stream = new SimpleStream<T>(() => new Promise(res => {
        clearInterval(interval);
        server.close(() => res())
    }));

    server.on("connection", (ws) => {
        const instance = { socket: ws, alive: true };
        connections.push(instance);

        ws.on("message", async (msg: RawData, isBinary: boolean) => {
            const item = await des(msg.toString())
            stream.push(item);
        });

        ws.on("pong", () => instance.alive = true);
    });

    return stream;
}


export class WsStreamReaderFactory implements StreamReaderFactory<WsReaderConfig> {
    public readonly type = WSConnectorType;

    build<T>(config: WsReaderConfig, deserializer?: (message: string) => T | PromiseLike<T>): Promise<Stream<T>> {
        return startWsStreamReader(config, deserializer);
    }
}
