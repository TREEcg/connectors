export interface ISASLOptions {
  mechanism: 'plain';
  username: string;
  password: string;
}

export interface IBrokerConfig {
  hosts: string[];
  ssl?: boolean;
  sasl?: ISASLOptions;
}

export interface IConsumerConfig {
  groupId: string;
  metadataMaxAge?: number;
  sessionTimeout?: number;
  rebalanceTimeout?: number;
  heartbeatInterval?: number;
  maxBytesPerPartition?: number;
  minBytes?: number;
  maxBytes?: number;
  maxWaitTimeInMs?: number;
  allowAutoTopicCreation?: boolean;
  maxInFlightRequests?: number;
  readUncommitted?: boolean;
  rackId?: string;
}

export interface ICSTopic {
  topic: string; fromBeginning?: boolean;
}
