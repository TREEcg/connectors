export type Configs<T, C> = {
  [P in keyof T]: ITyped<C>
};
export type Deserializers<T> = {
  [P in keyof T]?: (member: string) => T[P] | PromiseLike<T[P]>
};
export type Serializers<T> = {
  [P in keyof T]?: (item: T[P]) => string | PromiseLike<string>
};

export interface IWriter<T> {
  push: (item: T) => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface IStream<T> {
  lastElement?: T;
  disconnect: () => Promise<void>;
  data: (listener: (t: T) => PromiseLike<void> | void) => this;
  on: ((event: 'data', listener: (t: T) => PromiseLike<void> | void) => this)
  & ((event: 'end', listener: () => PromiseLike<void> | void) => this);
}

export interface ITyped<C> {
  type: string;
  config: C;
}

export interface IStreamReaderFactory<C> {
  type: string;
  build: <T>(config: C, deserializer?: (message: string) => T | PromiseLike<T>) => Promise<IStream<T>>;
}

export interface IStreamWriterFactory<C> {
  type: string;
  build: <T>(config: C, serializer?: (item: T) => string | PromiseLike<string>) => Promise<IWriter<T>>;
}

export class ReaderFactoryBuilder<Cs> {
  private readonly inner: IStreamReaderFactory<Cs>[];

  public constructor(inner: IStreamReaderFactory<Cs>[]) {
    this.inner = inner;
  }

  public add<C>(factory: IStreamReaderFactory<C>): ReaderFactoryBuilder<Cs | C> {
    const nInner = <IStreamReaderFactory<Cs | C>[]> this.inner;
    nInner.push(factory);
    return new ReaderFactoryBuilder(nInner);
  }

  public build(): ReaderFactory<Cs> {
    return new ReaderFactory(this.inner);
  }
}

export class WriterFactoryBuilder<Cs> {
  private readonly inner: IStreamWriterFactory<Cs>[];

  public constructor(inner: IStreamWriterFactory<Cs>[]) {
    this.inner = inner;
  }

  public add<C>(factory: IStreamWriterFactory<C>): WriterFactoryBuilder<Cs | C> {
    const nInner = <IStreamWriterFactory<Cs | C>[]> this.inner.slice();
    nInner.push(factory);

    return new WriterFactoryBuilder(nInner);
  }

  public build(): WriterFactory<Cs> {
    return new WriterFactory(this.inner);
  }
}

function genericDeserialize<T>(message: string): T {
  try {
    return JSON.parse(message);
  } catch {
    return <T><unknown>message;
  }
}

export function fromDeserializer<T>(des?: (message: string) => T
| PromiseLike<T>): ((message: string) => T | PromiseLike<T>) {
  if (des) {
    return des;
  }
  return genericDeserialize;
}

export class ReaderFactory<C> {
  private readonly factories: IStreamReaderFactory<C>[];

  public constructor(factories: IStreamReaderFactory<C>[]) {
    this.factories = factories;
  }

  public async build<T>(config: ITyped<C>,
    deserializer?: (message: string) => T | PromiseLike<T>): Promise<IStream<T>> {
    for (const factory of this.factories) {
      if (factory.type.toLocaleLowerCase() === config.type.toLocaleLowerCase()) {
        return factory.build(config.config, deserializer);
      }
    }

    throw new Error('No correct factory found!');
  }

  public async buildReader<T>(configs: Configs<T, C>,
    deserializers: Deserializers<T> = {}): Promise<{[P in keyof T]: IStream<T[P]> }> {
    const streams: {[P in keyof T]?: IStream<T[P]> } = {};

    await Promise.all(
      Object.entries(configs).map(async ([key, value]: [string, ITyped<C>]) => {
        streams[<keyof T>key] = await this.build(value, deserializers[<keyof T>key]);
      }),
    );

    return <{[P in keyof T]: IStream<T[P]> }>streams;
  }
}

function genericSerialize<T>(item: T): string | PromiseLike<string> {
  if (typeof item === 'string' || item instanceof String) {
    return <string><unknown>item;
  }
  try {
    return JSON.stringify(item);
  } catch {
    return (<any>item).toString();
  }
}

export function fromSerializer<T>(ser?: (item: T) => string | PromiseLike<string>): ((item: T) => string
| PromiseLike<string>) {
  if (ser) {
    return ser;
  }
  return genericSerialize;
}
export class WriterFactory<C> {
  private readonly factories: IStreamWriterFactory<C>[];

  public constructor(factories: IStreamWriterFactory<C>[]) {
    this.factories = factories;
  }

  public async build<T>(config: ITyped<C>,
    serializer?: (item: T) => string | PromiseLike<string>): Promise<IWriter<T>> {
    for (const factory of this.factories) {
      if (factory.type.toLocaleLowerCase() === config.type.toLowerCase()) {
        return factory.build(config.config, serializer);
      }
    }

    throw new Error('No correct factory found!');
  }

  public async buildReader<T>(configs: Configs<T, C>,
    serializers: Serializers<T> = {}): Promise<{[P in keyof T]: IWriter<T[P]> }> {
    const streams: {[P in keyof T]?: IWriter<T[P]> } = {};

    await Promise.all(
      Object.entries(configs).map(async ([key, value]: [string, ITyped<C>]) => {
        streams[<keyof T>key] = await this.build(value, serializers[<keyof T>key]);
      }),
    );

    return <{[P in keyof T]: IWriter<T[P]> }>streams;
  }
}

export type Handler<T> = (item: T) => Promise<void> | void;

export class SimpleStream<T> implements IStream<T> {
  private readonly dataHandlers: Handler<T>[] = [];
  private readonly endHandlers: Handler<void>[] = [];

  public readonly disconnect: () => Promise<void>;
  public lastElement?: T | undefined;

  public constructor(onDisconnect?: () => Promise<void>) {
    this.disconnect = onDisconnect || (async () => { });
  }

  public data(listener: Handler<T>): this {
    this.dataHandlers.push(listener);
    return this;
  }

  public async push(data: T): Promise<void> {
    this.lastElement = data;
    await Promise.all(this.dataHandlers.map(handler => handler(data)));
  }

  public async end(): Promise<void> {
    await Promise.all(this.endHandlers.map(handler => handler()));
  }

  public on(event: 'data', listener: Handler<T>): this;
  public on(event: 'end', listener: Handler<void>): this;
  public on(event: 'data' | 'end', listener: Handler<any>): this {
    if (event === 'data') {
      this.dataHandlers.push(listener);
    }
    if (event === 'end') {
      this.endHandlers.push(listener);
    }
    return this;
  }
}
