# `connector-ws`

Connector that used websockets to transmit data.

## Config

- `port`: required parameter indicating what port to use as Reader
- `host`: required parameter indicating what host to use as Reader
- `url`: required parameter indicating what url to connect with as Writer

Note: duplicate information but that is ok. Url aggregates host and port and also specifies the protocol.

