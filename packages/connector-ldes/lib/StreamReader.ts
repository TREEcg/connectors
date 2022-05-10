import * as RDF from "@rdfjs/types";
import { LDESClient } from "@treecg/actor-init-ldes-client";
import { SimpleStream, Stream } from "@treecg/connector-types";

export interface Quad extends RDF.Quad {

}

type LDESItem = { "type": "data" | "metadata", "data": Quad[] };

export interface LDESReaderConfig {
    client: LDESClient,
    _init: any,
    url: string,
}

export async function startLDESStreamReader(config: LDESReaderConfig): Promise<Stream<LDESItem>> {
    const stream = config.client.createReadStream(config.url, { representation: "Quads" })
    const out = new SimpleStream<LDESItem>(async () => { stream.emit("close"); });

    stream.on("data", member => {
        out.push({ "type": "data", data: member })
    });

    stream.on("metadata", member => {
        out.push({ "type": "metadata", data: member })
    });

    stream.emit("close");

    stream.on("end", () => {
        out.end();
    });

    return out;
}

export class StreamReader {
    private readonly config: LDESReaderConfig;
    constructor(client: LDESClient, _init: any, url: string) {
        this.config = { client, _init, url };
    }

    stream(): Promise<Stream<LDESItem>> {
        return startLDESStreamReader(this.config);
    }
}