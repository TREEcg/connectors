# `@treecg/types`

Unites used types across many connectors.

## Usage

```typescript
async function main() {
    const factoryBuilder = new ReaderFactoryBuilder([]);
    const fooStreamReaderFactory = {
        type: "foo",
        build: (config: {}, deserializer?: (item: string) => any) => { throw "Not Implemented" }
    };
    const factory = factoryBuilder.add(fooStreamReaderFactory).build();

    const stream = await factory.build({ type: "foo" })
    stream.data(console.log);

    // Idem with WriterFactory(Builder)
}
```
