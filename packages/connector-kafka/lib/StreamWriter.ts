import { Serializer, StreamType, StreamWriter } from '@treecg/connector-types';
import { Kafka, Producer } from 'kafkajs';
import { KConfig } from './Common';

type TopicMap<T> = { [P in keyof T]: string };
export class KafkaWriter<T> {
    private readonly serializer: Serializer<T>;
    private readonly kafka: Kafka;

    private readonly connected: Promise<void>;
    private readonly producer: Producer;
    private readonly topicMap: TopicMap<T>;

    private readonly startPromise: Promise<void>;

    constructor(kakfaConfig: KConfig, topicMap: TopicMap<T>, serializer: Serializer<T>) {
        this.kafka = new Kafka(kakfaConfig);
        this.serializer = serializer;

        this.producer = this.kafka.producer();
        this.connected = this.producer.connect();
        this.topicMap = topicMap;
    }

    public started(): Promise<void> {
        return this.startPromise;
    }

    public async send<P extends keyof T>(field: P, value: T[P]) {
        const ser = this.serializer[field](value);
        const topic = this.topicMap[field];
        await this.connected;

        await this.producer.send({
            topic: topic, messages: [
                { value: ser }
            ]
        });
    }

    public async stop(): Promise<void> {
        await this.producer.disconnect();
    }
}


export class KafkaStreamWriter<T, M> extends KafkaWriter<StreamType<T, M>> implements StreamWriter<T, M> {
    push(item: T): Promise<void> {
        return super.send("data", item);
    }

    pushMetadata(meta: M): Promise<void> {
        return super.send("metadata", meta);
    }
}
