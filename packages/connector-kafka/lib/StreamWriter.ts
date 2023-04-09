import { fromSerializer, StreamWriterFactory, Writer } from '@treecg/connector-types';
import { Kafka, KafkaConfig, ProducerConfig } from 'kafkajs';
import { readFileSync } from 'node:fs';
import { BrokerConfig } from './Common';

export interface KafkaWriterConfig {
    topic: {
        name: string,
    },
    producer: ProducerConfig,
    broker: BrokerConfig | string,
}


export async function startKafkaStreamWriter<T>(config: KafkaWriterConfig, serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
    const ser = fromSerializer(serializer);
    const topic = config.topic.name;

    const brokerConfig: any = {};
    if (typeof config.broker === "string" || config.broker instanceof String) {
        Object.assign(brokerConfig, JSON.parse(readFileSync(<string>config.broker, "utf-8")));
    } else {
        Object.assign(brokerConfig, config.broker);
    }
    brokerConfig.brokers = brokerConfig.hosts;

    const kafka = new Kafka(<KafkaConfig>brokerConfig);

    const producer = kafka.producer(config.producer);
    await producer.connect();

    const push = async (item: T) => {
        const mes = await ser(item);
        await producer.send(
            { topic, messages: [{ value: mes }] }
        );
    };

    const disconnect = async () => {
        await producer.disconnect();
    };

    return { push, disconnect };
}

export class KafkaStreamWriterFactory implements StreamWriterFactory<KafkaWriterConfig> {
    public readonly type = "kafka";

    build<T>(config: KafkaWriterConfig, serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
        return startKafkaStreamWriter(config, serializer);
    }
}
