# `@treecg/connector-kafka`

Connector that used kafka to communicate messages.

## Options

- `type`: type of the connector created, to use this connector "file" is required
- `topic`: required parameters denoting the used kafka topic 
- `consumerConfig`: required parameter, the value is a json object as described at section consumerConfig
- `kafkaConfig`: required parameter, the value is either a string denoting the location of the config as described at section kafkaConfig, or a json object as described at section kafkaConfig
- `fromBeginning`: optional parameter. If set, the stream reader reads all messages from the kafka topic, not just new messages (default value is false)


### Consumer Config

- `groupId`: required parameter denoting the group (only used by the reader)

Other optional consumer parameters

metadataMaxAge, sessionTimeout, rebalanceTimeout, heartbeatInterval, maxBytesPerPartition, minBytes, maxBytes, maxWaitTimeInMs, allowAutoTopicCreation, maxInFlightRequests, readUncommitted, rackId.

For more information see [KafkaJs](https://kafka.js.org/).


### Kafka Config

- `brokers`: list of strings denoting the brokers or bootstrap servers.
- `clientId`: id used to connect to kafka

Other optional kafka parameters

ssl, sasl and many more

For more information see [KafkaJs](https://kafka.js.org/).


