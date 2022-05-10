# `@treecg/connector-all`

Combine all implemented connectors.

## Example usage

```typescript
function sleep(mills: number): Promise<void> {
    return new Promise(res => setTimeout(res, mills));
}

export async function main() {
    const writerFactory = new AllWriterFactory();
    const readerFactory = new AllReaderFactory();

    const fileConfig: Config = { 
        type: "file",
        path: "metadata.json",
        onReplace: true,
        readFirstContent: true
    };

    const kafkaConfig: Config = {
        type: "kafka",
        topic: { topic: "sometopic" },
        consumerConfig: { groupId: "somegroupId" },
        kafkaConfig: { brokers: ["localhost:9092"], clientId: "client1" }
    };

    const configs = { data: kafkaConfig, metadata: fileConfig };

    const allReader = await readerFactory.buildReader(configs);
    allReader.data.data(data => console.log("Got data", data));
    allReader.metadata.data(data => console.log("Got metadata", data));

    const allWriter = await writerFactory.buildReader(configs);
    await allWriter.data.push("data");
    await sleep(500);

    await allWriter.data.push("more data");
    await sleep(500);

    await allWriter.metadata.push("metadata changed!")
    await allWriter.data.push(1);
    await sleep(500);

    await allWriter.data.push(2);
}
```
