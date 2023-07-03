import type { IncomingMessage, RequestListener, Server, ServerResponse } from "http";
import { createServer } from "http";
import type { Readable } from "stream";
import { fromDeserializer, SimpleStream } from "@treecg/connector-types";
import type { Stream, StreamReaderFactory } from "@treecg/connector-types";
import { HTTPConnectorType } from "..";

function streamToString(stream: Readable): Promise<string> {
    const datas = <Buffer[]>[];
    return new Promise(res => {
        stream.on("data", data => {
            datas.push(data);
        });
        stream.on("end", () => res(Buffer.concat(datas).toString()));
    });
}

export interface HttpReaderConfig {
    host: string;
    port: number;
}

export function startHttpStreamReader<T>(config: HttpReaderConfig,
    deserializer?: (message: string) => T | PromiseLike<T>): Promise<Stream<T>> {
    const des = fromDeserializer(deserializer);
    let server: Server | undefined = undefined;

    const stream = new SimpleStream<T>(() => new Promise(res => {
        const cb = (): void => res();
        if (server !== undefined) {
            server.close(cb);
        } else {
            cb();
        }
    }));

    const requestListener: RequestListener = async function (req: IncomingMessage, res: ServerResponse) {
        try {
            const content = await streamToString(req);
            stream.push(await des(content)).catch(error => {
                throw error;
            });
        } catch (error: unknown) {
            console.error("Failed", error);
        }

        res.writeHead(200);
        res.end("OK");
    };

    server = createServer(requestListener);
    return new Promise(res => {
        const cb = (): void => res(stream);
        server?.listen(config.port, config.host, cb);
    });
}

export class HttpStreamReaderFactory implements StreamReaderFactory<HttpReaderConfig> {
    public readonly type = HTTPConnectorType;

    public build<T>(config: HttpReaderConfig,
        deserializer?: (message: string) => T | PromiseLike<T>): Promise<Stream<T>> {
        return startHttpStreamReader(config, deserializer);
    }
}
