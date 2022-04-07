import { WebSocket } from "ws";
import { IEventStreamMeta, IMember, IMetadata, IRecord, Serializer, StreamType, StreamWriter } from "@connectors/types";


class WSClient<T> {
    private closedQueue: (() => void)[] = [];
    private state: keyof T;
    private readonly serializer: Serializer<T>;
    private readonly ws: WebSocket;

    private open = false;

    constructor(url: string, serializer: Serializer<T>, startType: keyof T) {
        this.serializer = serializer;
        this.ws = new WebSocket(url);
        this.setDatatype(startType);
        this.ws.on("error", (e) => {
            console.error("WS client error:")
            console.error(e);
        });
        this.ws.on("ping", () => this.ws.pong());
        this.ws.on("open", this.init.bind(this));
    }

    connected(): Promise<boolean> {
        return new Promise((res) => {
            if (this.open) {
                res(true);
            } else {
                this.ws.on("open", () => res(true));
            }
        })
    }

    private init() {
        this.open = true;
        this.closedQueue.forEach(h => h());
        this.closedQueue = [];
    }

    private setDatatype(type: keyof T) {
        if (this.open) {
            if (type != this.state) {
                this.state = type;
                this.ws.send(this.state.toString(), { binary: false });
            }
        } else {
            this.closedQueue.push(
                () => this.setDatatype(type)
            );
        }
    }

    protected sendItem<K extends keyof T>(key: K, item: T[K]) {
        if (this.open) {
            this.setDatatype(key);
            const ser = this.serializer[key](item);
            this.ws.send(ser, { binary: true });
        } else {
            this.closedQueue.push(
                () => this.sendItem(key, item)
            );
        }
    }

    close() {
        this.ws.close();
    }
}

export class WSStreamWriter<T, M> extends WSClient<StreamType<T, M>> implements StreamWriter<T, M> {
    constructor(url: string, serializer: Serializer<StreamType<T, M>>) {
        super(url, serializer, "data");
    }
    async push(item: T): Promise<void> {
        super.sendItem("data", item);
    }

    async pushMetadata(meta: M): Promise<void> {
        super.sendItem("metadata", meta);
    }
}
