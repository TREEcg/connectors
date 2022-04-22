import { Deserializer, Handler, SimpleStream, Stream, StreamReader, StreamType } from "@treecg/connector-types";
import { RawData, WebSocket, WebSocketServer } from 'ws';


type WsInstance<T> = {
    ws: WebSocket,
    alive: boolean,
    current?: keyof T,
}

class WSServer<T> {
    private readonly handlers: { [K in keyof T]?: Handler<T[K]>[] } = {};
    private readonly deserializers: Deserializer<T>;
    private server: WebSocketServer;
    private clients: WsInstance<T>[] = [];
    private open = false;

    constructor(port: number, deserializers: Deserializer<T>, host = "localhost") {
        this.deserializers = deserializers;
        this.server = new WebSocketServer({ port, host });
        this.server.on("error", (e) => {
            console.error("Ws server error:")
            console.error(e);
        });
        this.server.on("listening", () => this.open = true);
        this.server.on("connection", (ws) => {
            const instance = this.setupWs(ws);
            this.clients.push(instance)
        });

        const interval = setInterval(() => {
            this.clients = this.clients.flatMap(instance => {
                if (!instance.alive) {
                    instance.ws.terminate();
                    return [];
                }

                instance.ws.ping();
                instance.alive = false;
                return [instance];
            });
        }, 30000);

        this.server.on("close", () => clearInterval(interval))
    }

    connected(): Promise<boolean> {
        return new Promise((res) => {
            if (this.open) {
                res(true);
            } else {
                this.server.on("listening", () => res(true));
            }
        })
    }

    private setupWs(ws: WebSocket): WsInstance<T> {
        const instance: WsInstance<T> = { ws, alive: true };

        ws.on("message", (msg: RawData, isBinary: boolean) => {
            if (isBinary && instance.current) {
                const item = this.deserializers[instance.current](<any>msg);
                this.broadcast(instance.current, item);
            } else {
                instance.current = <keyof T>msg.toString();
            }
        });

        ws.on("pong", () => instance.alive = true);
        return instance;
    }

    private broadcast<K extends keyof T>(key: K, item: T[K]) {
        const handlers: Handler<T[K]>[] = this.handlers[key] || [];
        for (const handler of handlers) {
            handler(item);
        }
    }

    on<K extends keyof T>(key: K, handler: (item: T[K]) => Promise<void>) {
        const handlers = this.handlers[key] || (this.handlers[key] = []);
        handlers?.push(handler);
    }

    close() {
        this.server.close();
    }
}

export class WSStreamReader<T, M> extends WSServer<StreamType<T, M>> implements StreamReader<T, M> {
    private readonly dataStream: SimpleStream<T> = new SimpleStream();
    private readonly metadataStream: SimpleStream<M> = new SimpleStream();
    private current?: T;
    private currentMeta?: M;

    constructor(port: number, deserializers: Deserializer<StreamType<T, M>>) {
        super(port, deserializers);
        this.dataStream.on("data", async (r) => { this.current = r; })
        this.metadataStream.on("data", async (r) => { this.currentMeta = r; })

        super.on("data", async (i) => this.dataStream.push(i))
        super.on("metadata", async (i) => this.metadataStream.push(i))
    }

    getStream(): Stream<T> {
        return this.dataStream;
    }

    getCurrent(): T | undefined {
        return this.current;
    }

    getMetadataStream(): Stream<M> {
        return this.metadataStream;
    }

    getCurrentMetadata(): M | undefined {
        return this.currentMeta;
    }
}
