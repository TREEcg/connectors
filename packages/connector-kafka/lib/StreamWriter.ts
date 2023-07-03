import { readFileSync } from "node:fs";
import type { StreamWriterFactory, Writer } from "@treecg/connector-types";
import { fromSerializer } from "@treecg/connector-types";
import type { KafkaConfig, ProducerConfig } from "kafkajs";
import { Kafka } from "kafkajs";
import type { BrokerConfig } from "./Common";

export interface KafkaWriterConfig {
    topic: {
        name: string;
    };
    producer: ProducerConfig;
    broker: BrokerConfig | string;
}

export async function startKafkaStreamWriter<T>(config: KafkaWriterConfig,
    serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
    const ser = fromSerializer(serializer);
    const topic = config.topic.name;

    const brokerConfig: unknown = {};
    if (typeof config.broker === "string" || config.broker instanceof String) {
        Object.assign(<BrokerConfig>brokerConfig, JSON.parse(readFileSync(<string>config.broker, "utf-8")));
    } else {
        Object.assign(<BrokerConfig>brokerConfig, config.broker);
    }
    if(brokerConfig && (<BrokerConfig>brokerConfig).hosts) {
        (<KafkaConfig>brokerConfig).brokers =(<BrokerConfig>brokerConfig).hosts;
    }

    const kafka = new Kafka(<KafkaConfig>brokerConfig);

    const producer = kafka.producer(config.producer);
    await producer.connect();

    const push = async (item: T): Promise<void> => {
        const mes = await ser(item);
        await producer.send(
            { topic, messages: [{ value: mes }]},
        );
    };

    const end = async (): Promise<void> => {
        await producer.disconnect();
    };

    return { push, end };
}

export class KafkaStreamWriterFactory implements StreamWriterFactory<KafkaWriterConfig> {
    public readonly type = "kafka";

    public build<T>(config: KafkaWriterConfig,
        serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
        return startKafkaStreamWriter(config, serializer);
    }
}
