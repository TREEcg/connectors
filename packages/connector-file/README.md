# `@treecg/connector-file`

Connector that communicates via a filesystem.

## Options

- `type`: type of the connector created, to use this connector "file" is required
- `path`: required parameter denoting the path of the file used for communication
- `onReplace`: required parameter denoting how the file is used to communicate, possible values:
    - `true`: the entire file is read parsed and sent on change
    - `false`: the appended content is parsed and sent on append
- `readFirstContent`: optional parameter, only used if `onReplace` equals `true`. When Reader is started the current content is used for the first message.
- `encoding`: optional parameter used to denote the encoding of the file (defaults to `utf-8`)
