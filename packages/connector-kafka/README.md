# `@treecg/connector-kafka`

Connector that used kafka to communicate messages.

## Options

- `topic`: required parameter, the value is a json object as described at section [Topic Config](topic-config)
- `consumer`: required parameter, the value is a json object as described at section [Consumer Config](consumer-config)
- `producer`: required parameter, the value is a json object as described at section [Producer Config](producer-config)
- `broker`: required parameter, the value is either a string denoting the location of the config as described at section [Broker Config](broker-config), or a json object as described at section [Broker Config](broker-config)


### Topic Config

- `name`: the name of the topic
- `fromBeginning`: optional, relevant for reader only. If set the reader will read all items on the kafka topic, not just the newly generated items.


### Producer Config

No required parameters

For more information see [KafkaJs](https://kafka.js.org/).


### Consumer Config

- `groupId`: required parameter denoting the group (only used by the reader)

Other optional consumer parameters

metadataMaxAge, sessionTimeout, rebalanceTimeout, heartbeatInterval, maxBytesPerPartition, minBytes, maxBytes, maxWaitTimeInMs, allowAutoTopicCreation, maxInFlightRequests, readUncommitted, rackId.

For more information see [KafkaJs](https://kafka.js.org/).


### Broker Config

- `hosts`: list of strings denoting the brokers or bootstrap servers.
- `clientId`: id used to connect to kafka

Other optional kafka parameters

ssl, sasl and many more

For more information see [KafkaJs](https://kafka.js.org/).


