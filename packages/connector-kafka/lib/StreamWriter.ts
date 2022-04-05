import { EventStream, IFragmentInfo, IMember, IMetadata, IRecord, LDESStreamType, LDESStreamWriter, Serializer, StreamType, StreamWriter } from '@connectors/types';
import { ConsumerConfig, ConsumerSubscribeTopic, Kafka, KafkaConfig, KafkaMessage, Producer } from 'kafkajs';
import { KConfig } from './Common';

export class KafkaWriter<T> {
    private readonly serializer: Serializer<T>;
    private readonly kafka: Kafka;

    private readonly connected: Promise<void>;
    private readonly producer: Producer;
    private readonly topic: string;

    private readonly startPromise: Promise<void>;

    constructor(kakfaConfig: KConfig, serializer: Serializer<T>, topic: string) {
        this.kafka = new Kafka(kakfaConfig);
        this.serializer = serializer;

        this.producer = this.kafka.producer();
        this.connected = this.producer.connect();
        this.topic = topic;
    }

    public started(): Promise<void> {
        return this.startPromise;
    }

    public async send<P extends keyof T>(field: P, value: T[P]) {
        const ser = this.serializer[field](value);
        await this.connected;

        await this.producer.send({
            topic: this.topic, messages: [
                { key: field.toString(), value: ser }
            ]
        });
    }

    public async stop(): Promise<void> {
        await this.producer.disconnect();
    }
}


export class KafkaStreamWriter extends KafkaWriter<StreamType> implements StreamWriter {
    push(item: IRecord): Promise<void> {
        return super.send("data", item);
    }

    pushMetadata(meta: IMetadata): Promise<void> {
        return super.send("metadata", meta);
    }
}

export class WSLDESStreamWriter extends KafkaWriter<LDESStreamType> implements LDESStreamWriter {
    pushFragment(fragment: IFragmentInfo): Promise<void> {
        return super.send("fragment", fragment);
    }

    push(item: IMember): Promise<void> {
        return super.send("data", item);
    }

    pushMetadata(meta: EventStream): Promise<void> {
        return super.send("metadata", meta);
    }
}