import type * as RDF from "@rdfjs/types";
import type { LDESClient } from "@treecg/actor-init-ldes-client";
import { OutputRepresentation } from "@treecg/actor-init-ldes-client";
import type { Stream } from "@treecg/connector-types";
import { SimpleStream } from "@treecg/connector-types";

export interface Quad extends RDF.Quad {

}

interface LDESItem {
    "type": "data" | "metadata"; "data": Quad[];
}

export interface LDESReaderConfig {
    client: LDESClient;
    _init: any;
    url: string;
}

export async function startLDESStreamReader(config: LDESReaderConfig): Promise<Stream<LDESItem>> {
    const stream = config.client.createReadStream(config.url, { representation: OutputRepresentation.Quads });
    const out = new SimpleStream<LDESItem>(async () => {
        stream.emit("close");
    });

    stream.on("data", member => {
        out.push({ type: "data", data: member }).catch(error => {
            throw error;
        });
    });

    stream.on("metadata", member => {
        out.push({ type: "metadata", data: member }).catch(error => {
            throw error;
        });
    });

    stream.emit("close");

    stream.on("end", () => {
        out.end().catch(error => {
            throw error;
        });
    });

    return out;
}

export class StreamReader {
    private readonly config: LDESReaderConfig;
    public constructor(client: LDESClient, _init: any, url: string) {
        this.config = { client, _init, url };
    }

    public stream(): Promise<Stream<LDESItem>> {
        return startLDESStreamReader(this.config);
    }
}
