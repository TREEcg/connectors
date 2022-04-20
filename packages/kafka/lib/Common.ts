export interface SASLOptions {
    mechanism: "plain",
    username: string,
    password: string,
}

export interface KConfig {
    brokers: string[],
    ssl?: boolean,
    sasl?: SASLOptions,
    clientId: string,
}

export interface CConfig {
    groupId: string
    metadataMaxAge?: number
    sessionTimeout?: number
    rebalanceTimeout?: number
    heartbeatInterval?: number
    maxBytesPerPartition?: number
    minBytes?: number
    maxBytes?: number
    maxWaitTimeInMs?: number
    allowAutoTopicCreation?: boolean
    maxInFlightRequests?: number
    readUncommitted?: boolean
    rackId?: string
}

export interface CSTopic {
    topic: string; fromBeginning?: boolean
}