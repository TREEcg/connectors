import { describe, it, expect } from "@jest/globals";
import { WsStreamReaderFactory, WsStreamWriterFactory } from "..";

describe("connector-ws", () => {
    it("Should write -> WebSocket -> read", async () => {
        const readerFactory = new WsStreamReaderFactory();
        const writerFactory = new WsStreamWriterFactory();

        const items: unknown[] = [];

        const streamReader = await readerFactory.build({
            host: "0.0.0.0",
            port: 8_123,
        }, JSON.parse);
        streamReader.data(data => {
            items.push(data);
        });

        const streamWriter = await writerFactory.build({ url: "ws://127.0.0.1:8123" }, JSON.stringify);
        await streamWriter.push({ test: 2 });
        await sleep(200);
        await streamWriter.push({ test: 3 });
        await sleep(200);

        expect(items).toEqual([{ test: 2 }, { test: 3 }]);
        
        await Promise.all([
            streamWriter.disconnect(),
            streamReader.disconnect()
        ]);
    });
});

function sleep(x: number): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, x));
}
