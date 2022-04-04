'use strict';

const connectorHttp = require('..');

function sleep(x) {
    return new Promise((resolve) => setTimeout(resolve, x));
}

describe('connector-http', () => {
    it('needs tests', async () => {
        const server = new connectorHttp.WSLDESStreamReader(8123, { data: JSON.parse, metadata: JSON.parse }, "0.0.0.0");

        await server.connected();

        const items = [];
        const meta = [];
        server.getStream().on("data", items.push.bind(items));
        server.getMetadataStream().on("data", meta.push.bind(meta));

        const client = new connectorHttp.WSLDESStreamWriter("ws://127.0.0.1:8123", { data: JSON.stringify, metadata: JSON.stringify });
        client.push({ "test": 2 });
        client.pushMetadata("metadata!");

        await sleep(200);
        client.push({ "test": 3 });
        await sleep(200);

        expect(items).toEqual([{ "test": 2 }, { "test": 3 }])
        expect(meta).toEqual(["metadata!"])

        client.close();
        server.close();
    });
});
