# `connector-http`

Connector that used http actions to transmit data.

## Config

- `port`: required parameter indicating what port to use as Reader
- `host`: required parameter indicating what host to use as Reader
- `url`: required parameter indicating what url to connect with as Writer
- `method`: parameter indicating the used HTTP method to use as Writer

Note: duplicate information but that is ok. Url aggregates host and port and also specifies the protocol.

