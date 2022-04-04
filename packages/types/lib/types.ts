
export interface IRecord { };

export interface IMember extends IRecord {
    id: string;
}

export interface IMetadata {
    licence?: string;
};

export interface EventStream extends IMetadata {
    view: any;
}

export interface IFragmentInfo {
    id: any;
}


export interface Stream<T> {
    on(event: "data", listener: (t: T) => Promise<void>): this;
    on(event: "end", listener: () => Promise<void>): this;
}

export type Handler<T> = (item: T) => Promise<void>;

export class SimpleStream<T> implements Stream<T> {
    private readonly dataHandlers: Handler<T>[] = [];
    private readonly endHandlers: Handler<void>[] = [];

    push(data: T) {
        this.dataHandlers.forEach(h => h(data));
    }

    end() {
        this.endHandlers.forEach(h => h());
    }

    on(event: "data", listener: Handler<T>): this;
    on(event: "end", listener: Handler<void>): this;
    on(event: "data" | "end", listener: Handler<any>): this {
        if (event == "data") {
            this.dataHandlers.push(listener);
        }
        if (event == "end") {
            this.endHandlers.push(listener);
        }
        return this;
    }
}



export interface StreamReader {
    getStream(): Stream<IRecord>;
    getCurrent(): IRecord | undefined;

    getMetadataStream(): Stream<IMetadata>;
    getCurrentMetadata(): IMetadata | undefined;
}

export interface LDESStreamReader extends StreamReader {
    getStream(): Stream<IMember>;
    getCurrent(): IMember | undefined;

    getFragmentsStream(): Stream<IFragmentInfo>;
    getMetadataStream(): Stream<EventStream>;

    getCurrentMetadata(): EventStream | undefined;

}

export interface StreamWriter {
    push(item: IRecord): void;
    pushMetadata(meta: IMetadata): void;
}

export interface LDESStreamWriter extends StreamWriter {
    pushFragment(fragment: IFragmentInfo): void;
}


export type Serializer<T> = { [P in keyof T]: (item: T[P]) => any }
export type Deserializer<T> = { [P in keyof T]: (item: any) => T[P] }  
