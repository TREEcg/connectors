import { describe, it, expect } from "@jest/globals";
import { KafkaStreamReaderFactory, KafkaStreamWriterFactory } from "..";


function sleep(x: number): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, x));
}

describe("connector-kafka", () => {
    it("Should write -> Kafka Topic -> read", async () => {
        const readerFactory = new KafkaStreamReaderFactory();
        const writerFactory = new KafkaStreamWriterFactory();

        const items: unknown[] = [];

        const streamReader = await readerFactory.build({
            topic: {
                name: "quickstart-events",
                fromBeginning: true,
            },
            consumer: { groupId: "testers8" },
            broker: { hosts: ["127.0.0.1:9092"] },
        }, JSON.parse);
        streamReader.data(data => {
            items.push(data);
        });

        const streamWriter = await writerFactory.build({
            topic: { name: "quickstart-events" },
            producer: {},
            broker: { hosts: ["127.0.0.1:9092"] },
        }, JSON.stringify);

        await streamWriter.push({ test: 2 });
        await streamWriter.push({ test: 3 });
        await sleep(2_000);

        expect(items).toEqual([{ test: 2 }, { test: 3 }]);

        await Promise.all([
            streamWriter.disconnect(),
            streamReader.disconnect(),
        ]);
    }, 20_000);
});
