import { readFileSync } from 'node:fs';
import type { IStreamWriterFactory, IWriter } from '@treecg/connector-types';
import { fromSerializer } from '@treecg/connector-types';
import type { KafkaConfig, ProducerConfig } from 'kafkajs';
import { Kafka } from 'kafkajs';
import type { IBrokerConfig } from './Common';

export interface IKafkaWriterConfig {
  topic: {
    name: string;
  };
  producer: ProducerConfig;
  broker: IBrokerConfig | string;
}

export async function startKafkaStreamWriter<T>(config: IKafkaWriterConfig,
  serializer?: (item: T) => string | PromiseLike<string>): Promise<IWriter<T>> {
  const ser = fromSerializer(serializer);
  const topic = config.topic.name;

  const brokerConfig: any = {};
  if (typeof config.broker === 'string' || config.broker instanceof String) {
    Object.assign(brokerConfig, JSON.parse(readFileSync(<string>config.broker, 'utf-8')));
  } else {
    Object.assign(brokerConfig, config.broker);
  }
  brokerConfig.brokers = brokerConfig.hosts;

  const kafka = new Kafka(<KafkaConfig>brokerConfig);

  const producer = kafka.producer(config.producer);
  await producer.connect();

  const push = async (item: T): Promise<void> => {
    const mes = await ser(item);
    await producer.send(
      { topic, messages: [{ value: mes }]},
    );
  };

  const disconnect = async (): Promise<void> => {
    await producer.disconnect();
  };

  return { push, disconnect };
}

export class KafkaStreamWriterFactory implements IStreamWriterFactory<IKafkaWriterConfig> {
  public readonly type = 'kafka';

  public build<T>(config: IKafkaWriterConfig,
    serializer?: (item: T) => string | PromiseLike<string>): Promise<IWriter<T>> {
    return startKafkaStreamWriter(config, serializer);
  }
}
