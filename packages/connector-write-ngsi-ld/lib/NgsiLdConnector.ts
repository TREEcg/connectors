import { Ngsildify } from "@brechtvdv/rdfs2ngsi-ld.js";
import type { IConfigConnector, IWritableConnector, LdesShape } from "@treecg/ldes-types";
import fetch from "node-fetch";
import type { RequestInit } from "node-fetch";
import { OpenIdFetcher } from "./OpenIdFetcher";

export interface IConfigNgsiLdConnector extends IConfigConnector {
    ngsiEndpoint: string;
    clientId?: string;
    clientSecret?: string;
    tokenEndpoint?: string;
    timestampPath?: string;
    versionOfPath?: string;
}

export class NgsiLdConnector implements IWritableConnector {
    private readonly members: any[];
    private readonly fetcher: any = {};
    private readonly ngsiEndpoint: string;
    private readonly timestampPath: string;
    private readonly versionOfPath: string;

    /**
   * Templates for the backend generator.
   */
    public static composeTemplate = "";

    public static helmTemplate = "";

    public constructor(config: IConfigNgsiLdConnector, shape: LdesShape, id: string) {
        this.members = [];
        this.ngsiEndpoint = config.ngsiEndpoint;

        if (config.timestampPath) {
            this.timestampPath = config.timestampPath;
        }

        if (config.versionOfPath) {
            this.versionOfPath = config.versionOfPath;
        }

        if (config.clientId && config.clientSecret && config.tokenEndpoint) {
            this.fetcher = new OpenIdFetcher(config.clientId, config.clientSecret, config.tokenEndpoint);
            this.initOpenIdFetcher();
        } else {
            this.fetcher.fetch = fetch;
        }
    }

    private initOpenIdFetcher(): void {
        this.fetcher.initToken();
    }

    /**
   * Writes a version to the corresponding backend system
   * @param member
   */
    public async writeVersion(member: any): Promise<void> {
        try {
            const ngsildify = new Ngsildify({
                timestampPath: this.timestampPath,
                versionOfPath: this.versionOfPath,
            });
            const objectsNgsi = await ngsildify.transform(member);

            for (const obj of objectsNgsi) {
                try {
                    const created = await this.createEntity(obj);

                    if (!created) {
                        await this.updateEntity(obj);
                    }
                } catch (error: unknown) {
                    console.error(error);
                }
            }
        } catch (error: unknown) {
            console.error(error);
        }
    }

    private async createEntity(entity: any): Promise<boolean> {
        const requestInit: RequestInit = {
            method: "POST",
            headers: {
                "Content-Type": "application/ld+json",
            },
            body: JSON.stringify(entity),
        };
        const url = `${this.ngsiEndpoint}entities/`;

        const response = await this.fetcher.fetch(url, requestInit);

        if (response.ok) {
            return true;
        }

        return false;
    }

    private async updateEntity(entity: any): Promise<boolean> {
        const memberURI = entity.id ? entity.id : entity["@id"];
        const requestInit: RequestInit = {
            method: "PATCH",
            headers: {
                "Content-Type": "application/ld+json",
            },
            body: JSON.stringify(entity),
        };
        const url = `${this.ngsiEndpoint}entities/${encodeURIComponent(memberURI)}/attrs`;

        const response = await this.fetcher.fetch(url, requestInit);

        if (response.ok) {
            return true;
        }

        return false;
    }

    /**
   * Initializes the backend system by creating tables, counters and/or enabling plugins
   */
    public async provision(): Promise<void> {
    // Nothing to provision here
        console.log("provision");
    }

    /**
   * Stops asynchronous operations
   */
    public async stop(): Promise<void> {
    //
    }
}
