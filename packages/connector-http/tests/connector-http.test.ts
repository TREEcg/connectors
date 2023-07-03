import { describe, it, expect } from "@jest/globals";
import { HttpStreamReaderFactory, HttpStreamWriterFactory } from "..";

describe("connector-http", () => {
    it("Should write -> HTTP -> read", async () => {
        const readerFactory = new HttpStreamReaderFactory();
        const writerFactory = new HttpStreamWriterFactory();

        const items: unknown[] = [];

        const streamReader = await readerFactory.build({
            host: "localhost",
            port: 8080
        }, JSON.parse);
        streamReader.data(data => {
            items.push(data);
        });

        const streamWriter = await writerFactory.build({
            url: "http://localhost:8080",
            method: "POST"
        }, JSON.stringify);

        await streamWriter.push({ test: 2 });
        await sleep(200);
        await streamWriter.push({ test: 3 });
        await sleep(200);

        expect(items).toEqual([{ test: 2 }, { test: 3 }]);
        
        await Promise.all([
            streamReader.end(),
            streamWriter.end()
        ]);
    });
});

function sleep(x: number): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, x));
}
