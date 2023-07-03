import fetch from "node-fetch";
import type { RequestInfo, RequestInit } from "node-fetch";
const interval = require("interval-promise");

export class OpenIdFetcher {
    private accessToken: string;
    private readonly expiresIn = 3_600;

    // eslint-disable-next-line max-len
    public constructor(private readonly clientId: string, private readonly clientSecret: string, private readonly tokenEndpoint: string) {
    }

    public async initToken(): Promise<void> {
        await this.authenticate();

        // Silent refresh
        console.log(`set interval: ${this.expiresIn}`);
        // Convert to miliseconds + take margin (10%)
        interval(async () => this.authenticate(), this.expiresIn * 900);
    }

    private async authenticate(): Promise<void> {
        const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
        const headersPost = {
            Authorization: `Basic ${authString}`,
            "Content-type": "application/json",
        };

        await fetch(this.tokenEndpoint, {
            method: "POST",
            headers: headersPost,
            body: JSON.stringify({ grant_type: "client_credentials" }),
        })
            .then((res: any) => res.json())
            .then((json: any) => {
                if (json.access_token) {
                    this.accessToken = json.access_token;
                } else {
                    throw new Error("Access Token not available");
                }
            })
            .catch((error: unknown) => console.error(error));
    }

    public async fetch(url: RequestInfo, options?: RequestInit): Promise<any> {
        let requestInit: RequestInit = {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        };

        if (options) {
            options.headers = { ...requestInit.headers, ...options.headers };
            requestInit = options;
        }

        const res = await fetch(url, requestInit);
        const json: any = await res.json();
        if (json && json.errors && json.errors[0] && json.errors[0].error && json.errors[0].error.title) {
            for (const error in json.errors) {
                console.error(json.errors[error].error.title);
            }
        } else if (json.type === "https://uri.etsi.org/ngsi-ld/errors/InternalError" && json.title && json.detail) {
            console.error(`${json.title}: ${json.detail}`);
        }
        return json;
    }
}
