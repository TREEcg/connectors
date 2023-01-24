import { StreamWriterFactory, Writer } from "@treecg/connector-types";
import { HTTPConnectorType } from "..";

import * as https from "https";
import * as http from "http";
import { IncomingMessage } from "http";

export interface HttpWriterConfig {
    url: string,
    method: string,
}


export async function startHttpStreamWriter<T>(config: HttpWriterConfig, serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
    const ser = serializer || JSON.stringify;
    const requestConfig = <https.RequestOptions>new URL(config.url);


    const push = async (item: T) => {
        const body = await ser(item);

        await new Promise(async res => {
            let options = {
                hostname: requestConfig.hostname,
                path: requestConfig.path,
                method: config.method,
                port: requestConfig.port,
            };
            const cb = (response: IncomingMessage) => {
                response.on("data", () => { });
                response.on("end", () => { res(null); });
            };

            const req = http.request(options, cb);
            req.write(body, () => res(null));
            req.end();
        });
    }

    const disconnect = async () => { };

    return { push, disconnect };
}

export class HttpStreamWriterFactory implements StreamWriterFactory<HttpWriterConfig> {
    public readonly type = HTTPConnectorType;

    build<T>(config: HttpWriterConfig, serializer?: (item: T) => string | PromiseLike<string>): Promise<Writer<T>> {
        return startHttpStreamWriter(config, serializer);
    }
}
