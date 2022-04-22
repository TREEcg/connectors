import { Deserializer, Handler, SimpleStream, Stream, StreamReader, StreamType } from "@treecg/connector-types";
import { Consumer, Kafka, KafkaMessage } from 'kafkajs';
import { readFileSync } from "node:fs";
import { CConfig, CSTopic, KConfig } from "./Common";

export class KafkaReader<T> {
    private readonly kafka: Kafka;
    private readonly consumer: Consumer;
    private readonly handlers: { [K in keyof T]?: Handler<T[K]>[] } = {};
    private readonly deserializers: Deserializer<T>;
    private readonly topic: string;

    private readonly startPromise: Promise<void>;

    private readonly loop: Promise<void>;

    constructor(kafkaConfig: KConfig | string, consumerConfig: CConfig, subscribeConfig: CSTopic, deserializers: Deserializer<T>) {
        if (typeof kafkaConfig === "string" || kafkaConfig instanceof String) {
            const config = readFileSync(<string>kafkaConfig, "utf-8");
            this.kafka = new Kafka(JSON.parse(config));
        } else {
            this.kafka = new Kafka(kafkaConfig);
        }

        this.deserializers = deserializers;
        this.topic = subscribeConfig.topic;

        const consumer = this.kafka.consumer(Object.assign({ maxWaitTimeInMs: 500, heartbeatInterval: 1000, retry: { retries: 0 } }, consumerConfig));

        this.startPromise = consumer.connect();
        consumer.subscribe(subscribeConfig);
        this.consumer = consumer;

        this.loop = consumer.run({ autoCommit: true, autoCommitThreshold: 1, eachMessage: this.handleMessage.bind(this) })
    }

    public started(): Promise<void> {
        return this.startPromise;
    }

    public runLoop(): Promise<void> {
        return this.loop;
    }

    public async stop(): Promise<void> {
        await this.consumer.pause([{ topic: this.topic }]);
        await this.consumer.disconnect();
        await this.consumer.stop();
    }

    protected async handleMessage({ message }: { message: KafkaMessage }) {
        const key = <keyof T>message.key?.toString();

        if (this.deserializers[key]) {
            const item = this.deserializers[<keyof T>key](message.value);

            const handlers = this.handlers[key] || [];
            handlers?.forEach(h => h(item));
        }
    }

    protected on<K extends keyof T>(key: K, handler: (item: T[K]) => Promise<void>) {
        const handlers = this.handlers[key] || (this.handlers[key] = []);
        handlers?.push(handler);
    }
}

export class KafkaStreamReader<T, M> extends KafkaReader<StreamType<T, M>> implements StreamReader<T, M> {
    protected readonly dataStream: SimpleStream<T> = new SimpleStream();
    protected readonly metadataStream: SimpleStream<M> = new SimpleStream();
    private current?: T;
    private currentMeta?: M;

    constructor(kafkaConfig: KConfig | string, consumerConfig: CConfig, subscribeConfig: CSTopic, deserializers: Deserializer<StreamType<T, M>>) {
        super(kafkaConfig, consumerConfig, subscribeConfig, deserializers);

        super.on("data", async (item) => this.dataStream.push(item));
        super.on("metadata", async (item) => this.metadataStream.push(item));
        this.dataStream.on("data", async (r) => { this.current = r; })
        this.metadataStream.on("data", async (r) => { this.currentMeta = r; })
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
