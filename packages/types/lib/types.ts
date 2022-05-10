import { config } from "process";

export type Configs<T, C extends Typed> = { [P in keyof T]: C };
export type Deserializers<T> = { [P in keyof T]?: (member: string) => T[P] };
export type Serializers<T> = { [P in keyof T]?: (item: T[P]) => string };

export interface Writer<T> {
    push(item: T): Promise<void>;
    disconnect(): Promise<void>;
}

export interface Stream<T> {
    lastElement?: T;
    disconnect(): Promise<void>;
    data(listener: (t: T) => PromiseLike<void> | void): this;
    on(event: "data", listener: (t: T) => PromiseLike<void> | void): this;
    on(event: "end", listener: () => PromiseLike<void> | void): this;
}

export interface Typed {
    type: string;
};

export interface StreamReaderFactory<C extends Typed> {
    type: string;
    build<T>(config: C, deserializer?: (message: string) => T): Promise<Stream<T>>;
}

export interface StreamWriterFactory<C extends Typed> {
    type: string;
    build<T>(config: C, serializer?: (item: T) => string): Promise<Writer<T>>;
}


export class ReaderFactoryBuilder<Cs extends Typed> {
    private readonly inner: StreamReaderFactory<Cs>[];

    public constructor(inner: StreamReaderFactory<Cs>[]) {
        this.inner = inner;
    }

    add<C extends Typed>(factory: StreamReaderFactory<C>): ReaderFactoryBuilder<Cs | C> {
        const nInner = <StreamReaderFactory<Cs | C>[]>this.inner;
        nInner.push(factory);
        return new ReaderFactoryBuilder(nInner);
    }

    build(): ReaderFactory<Cs> {
        return new ReaderFactory(this.inner);
    }
}

export class WriterFactoryBuilder<Cs extends Typed> {
    private readonly inner: StreamWriterFactory<Cs>[];

    public constructor(inner: StreamWriterFactory<Cs>[]) {
        this.inner = inner;
    }

    add<C extends Typed>(factory: StreamWriterFactory<C>): WriterFactoryBuilder<Cs | C> {
        const nInner = <StreamWriterFactory<Cs | C>[]>this.inner.slice();
        nInner.push(factory);

        return new WriterFactoryBuilder(nInner);
    }

    build(): WriterFactory<Cs> {
        return new WriterFactory(this.inner);
    }
}


export class ReaderFactory<C extends Typed> {
    private readonly factories: StreamReaderFactory<C>[];

    constructor(factories: StreamReaderFactory<C>[]) {
        this.factories = factories;
    }

    async build<T>(config: C, deserializer?: (message: string) => T): Promise<Stream<T>> {
        for (let factory of this.factories) {
            if (factory.type.toLocaleLowerCase() === config.type.toLocaleLowerCase()) {
                return factory.build(config, deserializer);
            }
        }

        throw "No correct factory found!";
    }

    async buildReader<T>(configs: Configs<T, C>, deserializers: Deserializers<T> = {}): Promise<{ [P in keyof T]: Stream<T[P]> }> {
        const streams: { [P in keyof T]?: Stream<T[P]> } = {};

        await Promise.all(
            Object.entries(configs).map(async ([key, value]: [string, C]) => {
                streams[<keyof T>key] = await this.build(value, deserializers[<keyof T>key]);
            })
        )

        return <{ [P in keyof T]: Stream<T[P]> }>streams;
    }
}

export class WriterFactory<C extends Typed> {
    private readonly factories: StreamWriterFactory<C>[];

    constructor(factories: StreamWriterFactory<C>[]) {
        this.factories = factories;
    }

    async build<T>(config: C, serializer?: (item: T) => string): Promise<Writer<T>> {
        for (let factory of this.factories) {
            if (factory.type.toLocaleLowerCase() === config.type.toLowerCase()) {
                return factory.build(config, serializer);
            }
        }

        throw "No correct factory found!";
    }

    async buildReader<T>(configs: Configs<T, C>, serializers: Serializers<T> = {}): Promise<{ [P in keyof T]: Writer<T[P]> }> {
        const streams: { [P in keyof T]?: Writer<T[P]> } = {};

        await Promise.all(
            Object.entries(configs).map(async ([key, value]: [string, C]) => {
                streams[<keyof T>key] = await this.build(value, serializers[<keyof T>key]);
            })
        )

        return <{ [P in keyof T]: Writer<T[P]> }>streams;
    }
}


export type Handler<T> = (item: T) => Promise<void> | void;

export class SimpleStream<T> implements Stream<T> {
    private readonly dataHandlers: Handler<T>[] = [];
    private readonly endHandlers: Handler<void>[] = [];

    public readonly disconnect: () => Promise<void>;
    public lastElement?: T | undefined;

    constructor(onDisconnect?: () => Promise<void>) {
        this.disconnect = onDisconnect || (async () => { });
    }

    data(listener: Handler<T>): this {
        this.dataHandlers.push(listener);
        return this;
    }

    push(data: T) {
        this.lastElement = data;
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
