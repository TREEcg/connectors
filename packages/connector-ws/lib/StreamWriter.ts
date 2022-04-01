import { WebSocket } from "ws";
import { EventStream, IFragmentInfo, IMember, IMetadata, IRecord, LDESStreamReader, LDESStreamWriter, Serializer, StreamWriter } from "@connectors/types";

import { LDESStreamType, StreamType } from '../index';

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
        this.ws.on("ping", () => this.ws.pong());
        this.ws.on("open", this.init.bind(this));
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
            this.ws.send(item, { binary: true });
        } else {
            this.closedQueue.push(
                () => this.sendItem(key, item)
            );
        }
    }
}

export class WSStreamWriter extends WSClient<StreamType> implements StreamWriter {
    constructor(url: string, serializer: Serializer<StreamType>) {
        super(url, serializer, "data");
    }
    push(item: IRecord): void {
        super.sendItem("data", item);
    }

    pushMetadata(meta: IMetadata): void {
        super.sendItem("metadata", meta);
    }
}

export class WSLDESStreamWriter extends WSClient<LDESStreamType> implements LDESStreamWriter {
    constructor(url: string, serializer: Serializer<LDESStreamType>) {
        super(url, serializer, "data");
    }

    pushFragment(fragment: IFragmentInfo): void {
        super.sendItem("fragment", fragment);
    }

    push(item: IMember): void {
        super.sendItem("data", item);
    }

    pushMetadata(meta: EventStream): void {
        super.sendItem("metadata", meta);
    }
}