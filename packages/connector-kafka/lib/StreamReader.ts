import { SimpleStream, Stream, StreamReaderFactory } from "@treecg/connector-types";
import { Kafka, KafkaMessage } from 'kafkajs';
import { readFileSync } from "node:fs";
import { CConfig, KConfig } from "./Common";

export interface KafkaReaderConfig extends CConfig {
    type: "kafka",
    topic: string,
    fromBeginning?: boolean,
    consumerConfig: CConfig,
    kafkaConfig: KConfig | string,
}

export async function startKafkaStreamReader<T>(config: KafkaReaderConfig, deserializer?: (message: string) => T): Promise<Stream<T>> {
    const des = deserializer || JSON.parse;

    if (typeof config.kafkaConfig === "string" || config.kafkaConfig instanceof String) {
        config.kafkaConfig = JSON.parse(readFileSync(<string>config.kafkaConfig, "utf-8"));
    }

    const kafka = new Kafka(<KConfig>config.kafkaConfig);

    const consumer = kafka.consumer(config.consumerConfig);

    const stream = new SimpleStream<T>(async () => {
        await consumer.disconnect();
        await consumer.stop();
    });

    await consumer.connect();
    await consumer.subscribe({ topic: config.topic, fromBeginning: config.fromBeginning });

    consumer.run({
        eachMessage: async ({ topic, message }: { topic: string, message: KafkaMessage }) => {
            if (topic === config.topic) {
                const element = des(message.value!.toString());
                stream.push(element);
            }
        }
    });

    return stream;
}

export class KafkaStreamReaderFactory implements StreamReaderFactory<KafkaReaderConfig> {
    public readonly type = "kafka";

    build<T>(config: KafkaReaderConfig, deserializer?: (message: string) => T): Promise<Stream<T>> {
        return startKafkaStreamReader(config, deserializer);
    }
}
