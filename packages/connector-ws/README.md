# `connector-ws`

Connector that used websockets to transmit data.

A connector is a piece of code that is designed to connect over multiple programming languages.
Here the used protocol is websocket according to the following spec.

## Spec

According to the connector architecture there are multiple required channels.
StreamReader and StreamWriter require a `data` stream and a `metadata` stream.
LDESStreamReader and LDESStreamWriter require an extra `fragments` stream.

Objects are always sent as binairy websocket messages.
To interpret an object as `data` or `metadata`, ... a text message is sent just containing the name of the type of the following objects.

```js
send(TEXT, "data") // Sets current state to `data`
send(BIN, "some data") // "some data" is a `data` object
send(BIN, "some data") // "some data" is a `data` object

send(TEXT, "metadata") // Sets current state to `metadata`
send(BIN, "some metadata") // "some data" is a `metadata` object
```

Websockets heartbeats are supported in the spec and recommended for both client as server.

## Usage

### Reader

```ts
import {WSLDESStreamReader} from 'connector-ws';

async function main() {
    // Start server on port 8123 and interpret all types with `JSON.parse`
    const server = new connectorHttp.WSLDESStreamReader(8123, { data: JSON.parse, metadata: JSON.parse, fragment: JSON.parse  });

    // Optionally wait for the server to start listening for connections
    await server.connected();

   // Setup some data containers
    const items = [];
    const meta = [];

    // On some data items add them to the correct container
    server.getStream().on("data", items.push.bind(items));
    server.getMetadataStream().on("data", meta.push.bind(meta));
}
```


### Writer

```ts
import { WSLDESStreamWriter } from 'connector-ws';

async function main() {
    // Start server on port 8123 and interpret all types with `JSON.parse`
    const server = new connectorHttp.WSLDESStreamReader(8123, { data: JSON.parse, metadata: JSON.parse, fragment: JSON.parse  });

    // Optionally wait for the server to start listening for connections
    await server.connected();

   // Setup some data containers
    const items = [];
    const meta = [];

    // On some data items add them to the correct container
    server.getStream().on("data", items.push.bind(items));
    server.getMetadataStream().on("data", meta.push.bind(meta));
}
```
