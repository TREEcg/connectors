import { SimpleStream, Stream, StreamReaderFactory } from "@treecg/connector-types";
import { Kafka, KafkaConfig, KafkaMessage } from 'kafkajs';
import { readFileSync } from "node:fs";
import { KafkaConnectorType } from "..";
import { BrokerConfig, ConsumerConfig } from "./Common";

export interface KafkaReaderConfig {
    topic: {
        name: string,
        fromBeginning?: boolean,
    },
    consumer: ConsumerConfig,
    broker: string | BrokerConfig,
}

export async function startKafkaStreamReader<T>(config: KafkaReaderConfig, deserializer?: (message: string) => T | PromiseLike<T>): Promise<Stream<T>> {
    const des = deserializer || JSON.parse;

    const brokerConfig: any = {};
    if (typeof config.broker === "string" || config.broker instanceof String) {
        Object.assign(brokerConfig, JSON.parse(readFileSync(<string>config.broker, "utf-8")));
    } else {
        Object.assign(brokerConfig, config.broker);
    }
    brokerConfig.brokers = brokerConfig.hosts;

    const kafka = new Kafka(<KafkaConfig>brokerConfig);

    const consumer = kafka.consumer(config.consumer);

    const stream = new SimpleStream<T>(async () => {
        await consumer.disconnect();
        await consumer.stop();
    });

    await consumer.connect();
    await consumer.subscribe({ topic: config.topic.name, fromBeginning: config.topic.fromBeginning });

    consumer.run({
        eachMessage: async ({ topic, message }: { topic: string, message: KafkaMessage }) => {
            if (topic === config.topic.name) {
                const element = await des(message.value!.toString());
                stream.push(element);
            }
        }
    });

    return stream;
}

export class KafkaStreamReaderFactory implements StreamReaderFactory<KafkaReaderConfig> {
    public readonly type = KafkaConnectorType;

    build<T>(config: KafkaReaderConfig, deserializer?: (message: string) => T | PromiseLike<T>): Promise<Stream<T>> {
        return startKafkaStreamReader(config, deserializer);
    }
}
