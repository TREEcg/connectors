import { Deserializer, EventStream, Handler, IFragmentInfo, IMember, IMetadata, IRecord, LDESStreamReader, LDESStreamType, SimpleStream, Stream, StreamReader, StreamType } from "@connectors/types";
import { ConsumerConfig, ConsumerSubscribeTopic, Kafka, KafkaConfig, KafkaMessage } from 'kafkajs';
import { CConfig, CSTopic, KConfig } from "./Common";

export class KafkaReader<T> {
    private readonly kafka: Kafka;
    private readonly handlers: { [K in keyof T]?: Handler<T[K]>[] } = {};
    private readonly deserializers: Deserializer<T>;

    private readonly loop: Promise<void>;

    constructor(kafkaConfig: KConfig, consumerConfig: CConfig, subscribeConfig: CSTopic, deserializers: Deserializer<T>) {
        this.kafka = new Kafka(kafkaConfig);
        this.deserializers = deserializers;

        const consumer = this.kafka.consumer(consumerConfig);

        consumer.connect();
        consumer.subscribe(subscribeConfig);

        this.loop = consumer.run({ eachMessage: this.handleMessage.bind(this) })
    }

    public runLoop(): Promise<void> {
        return this.loop;
    }

    protected async handleMessage({ message }: { message: KafkaMessage }) {
        const key = <keyof T>message.key?.toString();

        if (this.deserializers[key]) {
            const item = this.deserializers[<keyof T>key](message.value);

            const handlers = this.handlers[key] || [];
            handlers?.forEach(h => h(item));
        }
    }

    on<K extends keyof T>(key: K, handler: (item: T[K]) => Promise<void>) {
        const handlers = this.handlers[key] || (this.handlers[key] = []);
        handlers?.push(handler);
    }
}

export class KafkaStreamReader extends KafkaReader<StreamType> implements StreamReader {
    protected readonly dataStream: SimpleStream<IRecord> = new SimpleStream();
    protected readonly metadataStream: SimpleStream<IMetadata> = new SimpleStream();
    private current?: IRecord;
    private currentMeta?: IMetadata;

    constructor(kafkaConfig: KConfig, consumerConfig: CConfig, subscribeConfig: CSTopic, deserializers: Deserializer<StreamType>) {
        super(kafkaConfig, consumerConfig, subscribeConfig, deserializers);

        super.on("data", async (item) => this.dataStream.push(item));
        super.on("metadata", async (item) => this.metadataStream.push(item));
        this.dataStream.on("data", async (r: IRecord) => { this.current = r; })
        this.metadataStream.on("data", async (r: IMetadata) => { this.currentMeta = r; })
    }

    getStream(): Stream<IRecord> {
        return this.dataStream;
    }

    getCurrent(): IRecord | undefined {
        return this.current;
    }

    getMetadataStream(): Stream<IMetadata> {
        return this.metadataStream;
    }

    getCurrentMetadata(): IMetadata | undefined {
        return this.currentMeta;
    }
}


export class KafkaLDESStreamReader extends KafkaReader<LDESStreamType> implements LDESStreamReader {
    protected readonly dataStream: SimpleStream<IMember> = new SimpleStream();
    protected readonly metadataStream: SimpleStream<EventStream> = new SimpleStream();
    protected readonly fragmentStream: SimpleStream<IFragmentInfo> = new SimpleStream();
    private current?: IMember;
    private currentMeta?: EventStream;

    constructor(kafkaConfig: KConfig, consumerConfig: CConfig, subscribeConfig: CSTopic, deserializers: Deserializer<LDESStreamType>) {
        super(kafkaConfig, consumerConfig, subscribeConfig, deserializers);

        super.on("data", async (item) => this.dataStream.push(item));
        super.on("metadata", async (item) => this.metadataStream.push(item));
        super.on("fragment", async (item) => this.fragmentStream.push(item));
        this.dataStream.on("data", async (r) => { this.current = r; })
        this.metadataStream.on("data", async (r) => { this.currentMeta = r; })
    }

    getFragmentsStream(): Stream<IFragmentInfo> {
        return this.fragmentStream;
    }

    getStream(): Stream<IMember> {
        return this.dataStream;
    }

    getCurrent(): IMember | undefined {
        return this.current;
    }

    getMetadataStream(): Stream<EventStream> {
        return this.metadataStream;
    }

    getCurrentMetadata(): EventStream | undefined {
        return this.currentMeta;
    }
}
