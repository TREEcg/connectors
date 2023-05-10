import { readFileSync } from 'node:fs';
import type { IStream, IStreamReaderFactory } from '@treecg/connector-types';
import { fromDeserializer, SimpleStream } from '@treecg/connector-types';
import type { KafkaConfig, KafkaMessage } from 'kafkajs';
import { Kafka } from 'kafkajs';
import { KafkaConnectorType } from '..';
import type { IBrokerConfig, IConsumerConfig } from './Common';

export interface IKafkaReaderConfig {
  topic: {
    name: string;
    fromBeginning?: boolean;
  };
  consumer: IConsumerConfig;
  broker: string | IBrokerConfig;
}

export async function startKafkaStreamReader<T>(config: IKafkaReaderConfig,
  deserializer?: (message: string) => T | PromiseLike<T>): Promise<IStream<T>> {
  const des = fromDeserializer(deserializer);

  const brokerConfig: any = {};
  if (typeof config.broker === 'string' || config.broker instanceof String) {
    Object.assign(brokerConfig, JSON.parse(readFileSync(<string>config.broker, 'utf-8')));
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
    async eachMessage({ topic, message }: { topic: string; message: KafkaMessage }) {
      if (topic === config.topic.name) {
        const element = await des(message.value!.toString());
        stream.push(element).catch(error => {
          throw error;
        });
      }
    },
  }).catch(error => {
    throw error;
  });

  return stream;
}

export class KafkaStreamReaderFactory implements IStreamReaderFactory<IKafkaReaderConfig> {
  public readonly type = KafkaConnectorType;

  public build<T>(config: IKafkaReaderConfig,
    deserializer?: (message: string) => T | PromiseLike<T>): Promise<IStream<T>> {
    return startKafkaStreamReader(config, deserializer);
  }
}
