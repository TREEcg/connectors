'use strict';

const { Store, Parser, NamedNode } = require('n3');
const connectorAll = require('..');

async function stringToConfigType(subj, input, reader) {
    const parser = new Parser();
    const quads = parser.parse(input);
    const store = new Store(quads);

    if (reader) {
        return await connectorAll.loadReaderConfig(subj, (s, p, o) => store.getQuads(s, p, o, null));
    } else {
        return await connectorAll.loadWriterConfig(subj, (s, p, o) => store.getQuads(s, p, o, null));
    }
}

describe('connector-all', () => {
    test("WS-config-reader-1", async () => {
        const out = await stringToConfigType(new NamedNode("test"), `
@prefix js: <https://w3id.org/conn/js#> .
@prefix ws: <https://w3id.org/conn/ws#> .
@prefix : <https://w3id.org/conn#> .

<test> a :WsReaderChannel;
  :wsUri "ws://localhost:3000".
            `, true);

        expect(out.type).toBe("ws");
    });

    test("WS-config-reader-2", async () => {
        const out = await stringToConfigType(new NamedNode("test"), `
@prefix js: <https://w3id.org/conn/js#> .
@prefix ws: <https://w3id.org/conn/ws#> .
@prefix : <https://w3id.org/conn#> .

<test> a :WsReaderChannel;
  :wsPort "3000".
            `, true);

        expect(out.type).toBe("ws");
    });

    test("WS-config-writer", async () => {
        const out = await stringToConfigType(new NamedNode("test"), `
@prefix js: <https://w3id.org/conn/js#> .
@prefix ws: <https://w3id.org/conn/ws#> .
@prefix : <https://w3id.org/conn#> .

<test> a :WsWriterChannel;
  :wsUri "ws://localhost:3000".
            `, false);

        expect(out.type).toBe("ws");
    });

    test("FILE-config-reader", async () => {
        const out = await stringToConfigType(new NamedNode("test"), `
@prefix js: <https://w3id.org/conn/js#> .
@prefix ws: <https://w3id.org/conn/ws#> .
@prefix : <https://w3id.org/conn#> .

<test> a :FileReaderChannel;
    :filePath "testPath";
    :fileOnReplace "true".
            `, true);

        expect(out.type).toBe("file");
    });

    test("FILE-config-writer", async () => {
        const out = await stringToConfigType(new NamedNode("test"), `
@prefix js: <https://w3id.org/conn/js#> .
@prefix ws: <https://w3id.org/conn/ws#> .
@prefix : <https://w3id.org/conn#> .

<test> a :FileWriterChannel;
  :filePath "testPath".
            `, false);

        expect(out.type).toBe("file");
    });

    test("HTTP-config-reader", async () => {
        const out = await stringToConfigType(new NamedNode("test"), `
@prefix js: <https://w3id.org/conn/js#> .
@prefix ws: <https://w3id.org/conn/ws#> .
@prefix : <https://w3id.org/conn#> .

<test> a :HttpReaderChannel;
    :httpPort "8123".
            `, true);

        expect(out.type).toBe("http");
    });

    test("HTTP-config-writer", async () => {
        const out = await stringToConfigType(new NamedNode("test"), `
@prefix js: <https://w3id.org/conn/js#> .
@prefix ws: <https://w3id.org/conn/ws#> .
@prefix : <https://w3id.org/conn#> .

<test> a :HttpWriterChannel;
  :httpMethod "POST";
  :httpEndpoint "localhost:8123".
            `, false);

        expect(out.type).toBe("http");
    });

    test("Kafka-config-reader", async () => {
        const out = await stringToConfigType(new NamedNode("test"), `
@prefix js: <https://w3id.org/conn/js#> .
@prefix ws: <https://w3id.org/conn/ws#> .
@prefix : <https://w3id.org/conn#> .

<test> a :KafkaReaderChannel;
  :kafkaTopic "epicTopic";
  :kafkaGroup "testGroup";
  :kafkaBroker "localhost:8123".

            `, true);

        expect(out.type).toBe("kafka");
    });

    test("Kafka-config-writer", async () => {
        const out = await stringToConfigType(new NamedNode("test"), `
@prefix js: <https://w3id.org/conn/js#> .
@prefix ws: <https://w3id.org/conn/ws#> .
@prefix : <https://w3id.org/conn#> .

<test> a :KafkaWriterChannel;
  :kafkaTopic "epicTopic";
  :kafkaBroker "localhost:8123".
            `, false);

        expect(out.type).toBe("kafka");
    });
});
