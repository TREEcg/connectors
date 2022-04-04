import { ConsumerConfig, ConsumerSubscribeTopic, KafkaConfig } from "kafkajs";

export interface KConfig  {
    brokers: string[],
    clientId: string,
}

export interface CConfig extends ConsumerConfig {

}
export interface CSTopic {
    topic: string; fromBeginning?: boolean
}