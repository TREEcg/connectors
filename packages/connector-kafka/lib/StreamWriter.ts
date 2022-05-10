import { StreamWriterFactory, Writer } from '@treecg/connector-types';
import { Kafka } from 'kafkajs';
import { readFileSync } from 'node:fs';
import { KConfig } from './Common';

export interface KafkaWriterConfig {
    type: "kafka",
    topic: {
        topic: string,
    },
    kafkaConfig: KConfig | string,
}


export async function startKafkaStreamWriter<T>(config: KafkaWriterConfig, serializer?: (item: T) => string): Promise<Writer<T>> {
    const ser = serializer || JSON.stringify;
    const topic = config.topic.topic;

    if (typeof config.kafkaConfig === "string" || config.kafkaConfig instanceof String) {
        config.kafkaConfig = JSON.parse(readFileSync(<string>config.kafkaConfig, "utf-8"));
    }

    const kafka = new Kafka(<KConfig>config.kafkaConfig);

    const producer = kafka.producer();
    await producer.connect();

    const push = async (item: T) => {
        const mes = ser(item);
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

    build<T>(config: KafkaWriterConfig, serializer?: (item: T) => string): Promise<Writer<T>> {
        return startKafkaStreamWriter(config, serializer);
    }
}