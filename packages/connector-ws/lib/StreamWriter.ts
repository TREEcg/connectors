import { StreamWriterFactory, Writer } from "@treecg/connector-types";
import { WebSocket } from "ws";

export interface WsWriterConfig {
    type: "ws",
    url: string,
}

export async function startWsStreamWriter<T>(config: WsWriterConfig, serializer?: (item: T) => string): Promise<Writer<T>> {
    const ser = serializer || JSON.stringify;
    const ws = new WebSocket(config.url);
    ws.on("error", (e) => {
        console.error("WS client error:")
        console.error(e);
    });

    ws.on("ping", () => ws.pong());
    await new Promise(res => ws.on("open", res));

    const push = async (item: T) => {
        const msg = ser(item);
        await new Promise(res => ws.send(msg, () => res(undefined)));
    }

    const disconnect = async () => {
        ws.close();
    }

    return { push, disconnect };
}

export class WsStreamWriterFactory implements StreamWriterFactory<WsWriterConfig> {
    public readonly type = "ws";

    build<T>(config: WsWriterConfig, serializer?: (item: T) => string): Promise<Writer<T>> {
        return startWsStreamWriter(config, serializer);
    }
}