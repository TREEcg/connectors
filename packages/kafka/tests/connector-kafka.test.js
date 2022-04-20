'use strict';

jest.setTimeout(10000);
const connectorKafka = require('..');

function sleep(x) {
    return new Promise((resolve) => setTimeout(resolve, x));
}

describe('connector-kafka', () => {
    it('needs tests', async () => {
        const server = new connectorKafka.KafkaStreamReader(
            { brokers: ["127.0.0.1:9092"] },
            { groupId: "testers8" },
            { topic: "quickstart-events", "fromBeginning": true },
            { "data": JSON.parse, "metadata": JSON.parse });
        await server.started();
        console.log("server connected")

        const items = [];
        const meta = [];
        server.getStream().on("data", items.push.bind(items));
        server.getMetadataStream().on("data", meta.push.bind(meta));

        const client = new connectorKafka.KafkaStreamWriter(
            { brokers: ["127.0.0.1:9092"] },
            { "data": JSON.stringify, "metadata": JSON.stringify },
            "quickstart-events");

        await client.started();

        console.log("client connected")
        await client.push({ "test": 2 });
        await client.pushMetadata("metadata!");
        await client.push({ "test": 3 });
        await sleep(5000);

        expect(items).toEqual([{ "test": 2 }, { "test": 3 }])
        expect(meta).toEqual(["metadata!"])

        console.log("issuing stop")
        // client.stop(); 
        await Promise.all([
            server.stop().then(() => console.log("server stopped")),
            client.stop().then(() => console.log("client stopped"))
        ])

        // await server.runLoop();
    });
});
