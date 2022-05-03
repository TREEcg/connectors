import { Deserializer, Handler, SimpleStream, Stream, StreamReader, StreamType } from "@treecg/connector-types";
import { Consumer, Kafka, KafkaMessage } from 'kafkajs';
import { readFileSync } from "node:fs";
import { CConfig, KConfig } from "./Common";

type InvTopicMap<T> = { [label: string]: { fromBeginning: boolean, key: keyof T } };

export class KafkaReader<T> {
    private readonly kafka: Kafka;
    private readonly consumer: Consumer;
    private readonly handlers: { [K in keyof T]?: Handler<T[K]>[] } = {};
    private readonly deserializers?: Deserializer<T>;

    private readonly topicMap: InvTopicMap<T>;

    private readonly startPromise: Promise<void>;

    private loop?: Promise<void>;

    constructor(kafkaConfig: KConfig, consumerConfig: CConfig, topics: InvTopicMap<T>, deserializers?: Deserializer<T>) {
        if (typeof kafkaConfig === "string" || kafkaConfig instanceof String) {
            const config = readFileSync(<string><any>kafkaConfig, "utf-8");
            this.kafka = new Kafka(JSON.parse(config));
        } else {
            this.kafka = new Kafka(kafkaConfig);
        }

        this.deserializers = deserializers;
        this.topicMap = topics;

        const consumer = this.kafka.consumer(Object.assign({ maxWaitTimeInMs: 500, heartbeatInterval: 1000, retry: { retries: 0 } }, consumerConfig));

        this.startPromise = (async () => {
            await consumer.connect();
            await Promise.all(Object.keys(topics).map(topic => consumer.subscribe({ topic: topic, fromBeginning: topics[topic].fromBeginning })))
            this.loop = consumer.run({ autoCommit: true, autoCommitThreshold: 1, eachMessage: this.handleMessage.bind(this) })
        })();

        this.consumer = consumer;
    }

    public started(): Promise<void> {
        return this.startPromise;
    }

    public runLoop(): Promise<void> {
        return this.startPromise.then(() => this.loop!);
    }

    public async stop(): Promise<void> {
        await this.consumer.pause(Object.keys(this.topicMap).map(topic => { return { topic } }));
        await this.consumer.disconnect();
        await this.consumer.stop();
    }

    protected async handleMessage({ topic, message }: { topic: string, message: KafkaMessage }) {
        const key = this.topicMap[topic].key;

        if (this.deserializers && this.deserializers[key]) {
            const item = this.deserializers[key](message.value);

            const handlers = this.handlers[key] || [];
            handlers?.forEach(h => h(item));
        } else {
            const handlers = this.handlers[key] || [];
            handlers?.forEach(h => h(<any>message.value));
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

    /**
     * 
     * @param kafkaConfig 
     * @param consumerConfig 
     * @param topics @range {json}
     * @param deserializers 
     */
    constructor(kafkaConfig: KConfig, consumerConfig: CConfig, topics: InvTopicMap<StreamType<T, M>>, deserializers: Deserializer<StreamType<T, M>>) {
        super(kafkaConfig, consumerConfig, topics, deserializers);

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
