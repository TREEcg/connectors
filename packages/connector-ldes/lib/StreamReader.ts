import { IEventStreamMeta, IMember, SimpleStream, Stream, StreamReader } from "@connectors/types";
import { LDESClient } from "@treecg/actor-init-ldes-client";

export class LDESStreamReader implements StreamReader<IMember, IEventStreamMeta> {
    private readonly dataStream: SimpleStream<IMember> = new SimpleStream();
    private readonly metadataStream: SimpleStream<IEventStreamMeta> = new SimpleStream();
    private current?: IMember;
    private currentMeta?: IEventStreamMeta;

    constructor(client: LDESClient, _init: any, url: string) {
        const stream = client.createReadStream(url, { representation: "Quads" })

        stream.on("data", member => {
            this.current = member;
            this.dataStream.push(member);
        });

        stream.on("metadata", member => {
            this.currentMeta = member;
            this.metadataStream.push(member);
        });

        stream.on("end", () => {
            this.metadataStream.end();
            this.dataStream.end();
        });
    }

    getStream(): Stream<IMember> {
        return this.dataStream;
    }

    getCurrent(): IMember | undefined {
        return this.current;
    }

    getMetadataStream(): Stream<IEventStreamMeta> {
        return this.metadataStream;
    }

    getCurrentMetadata(): IEventStreamMeta | undefined {
        return this.currentMeta;
    }
}