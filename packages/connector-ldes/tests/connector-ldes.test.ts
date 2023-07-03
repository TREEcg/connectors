import { describe, it, expect } from "@jest/globals";
import { newEngine } from "@treecg/actor-init-ldes-client";
import { StreamReader } from "..";

describe("connector-ldes", () => {
    it("should read an LDES feed", async () => {
        const items: unknown[] = [];
        const metadataItems: unknown[] = [];

        const reader = await new StreamReader(
            newEngine(), 
            { disableSynchronization: true }, 
            "https://semiceu.github.io/LinkedDataEventStreams/example.ttl"
        ).stream();
        
        reader.data(data => {
            if(data.type === "metadata") {
                metadataItems.push(data);
            } else if(data.type === "data") {
                items.push(data);
            }
        });

        const streamEnded = new Promise<void>((res) => {
            reader.on("end", res);
        });

        await streamEnded;
        expect(items.length).toBeGreaterThan(0);
        expect(metadataItems.length).toBeGreaterThan(0);
    });
});
