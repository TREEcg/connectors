import * as http from "http";
import type { IncomingMessage } from "http";
import type * as https from "https";
import type { StreamWriterFactory, Writer } from "@treecg/connector-types";
import { fromSerializer } from "@treecg/connector-types";
import { HTTPConnectorType } from "..";

export interface HttpWriterConfig {
    url: string;
    method: string;
}

export async function startHttpStreamWriter<T>(config: HttpWriterConfig,
    serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
    const ser = fromSerializer(serializer);
    const requestConfig = <https.RequestOptions> new URL(config.url);

    const push = async (item: T): Promise<void> => {
        const body = await ser(item);

        await new Promise(async res => {
            const options = {
                hostname: requestConfig.hostname,
                path: requestConfig.path,
                method: config.method,
                port: requestConfig.port,
            };
            const cb = (response: IncomingMessage): void => {
                response.on("data", () => { });
                response.on("end", () => {
                    res(null);
                });
            };

            const req = http.request(options, cb);
            req.write(body, () => res(null));
            req.end();
        });
    };

    const disconnect = async (): Promise<void> => { };

    return { push, disconnect };
}

export class HttpStreamWriterFactory implements StreamWriterFactory<HttpWriterConfig> {
    public readonly type = HTTPConnectorType;

    public build<T>(config: HttpWriterConfig,
        serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
        return startHttpStreamWriter(config, serializer);
    }
}
