
export interface KConfig {
    brokers: string[],
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