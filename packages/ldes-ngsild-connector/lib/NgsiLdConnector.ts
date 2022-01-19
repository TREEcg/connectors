import { Ngsildify } from '@brechtvdv/rdfs2ngsi-ld.js';
import type { IConfigConnector, IWritableConnector, LdesShape } from '@treecg/ldes-types';
import fetch from 'node-fetch';
import type { RequestInit } from 'node-fetch';
import { OpenIdFetcher } from './OpenIdFetcher';

export interface IConfigNgsiLdConnector extends IConfigConnector {
  ngsiEndpoint: string;
  clientId?: string;
  clientSecret?: string;
  tokenEndpoint?: string;
}

export class NgsiLdConnector implements IWritableConnector {
  private readonly members: any[];
  private readonly fetcher: any = {};
  private readonly ngsiEndpoint: string;
  /**
   * Templates for the backend generator.
   */
  public static composeTemplate = ``;

  public static helmTemplate = ``;

  public constructor(config: IConfigNgsiLdConnector, shape: LdesShape, id: string) {
    this.members = [];
    this.ngsiEndpoint = config.ngsiEndpoint;

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
    console.log('write version');
    const ngsildify = new Ngsildify();
    const objectsNgsi = await ngsildify.transform(member);
    console.log(`Transformed objects: ${JSON.stringify(objectsNgsi)}`);
    for (const obj of objectsNgsi) {
      const created = await this.createEntity(obj);

      if (!created) {
        await this.updateEntity(obj);
      }
    }
  }

  private async createEntity(entity: any): Promise<boolean> {
    let created = false;
    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ld+json',
      },
      body: JSON.stringify(entity),
    };
    const url = `${this.ngsiEndpoint}entities/`;

    const response = await this.fetcher.fetch(url, requestInit);

    if (response.ok) {
      created = response.ok;
    }

    if (created) {
      console.log('Succesfully created entity in broker');
    } else {
      console.log(`Something went wrong: ${response.statusText}`);
    }

    return created;
  }

  private async updateEntity(entity: any): Promise<boolean> {
    let updated = false;
    const memberURI = entity.id ? entity.id : entity['@id'];
    const requestInit: RequestInit = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/ld+json',
      },
      body: JSON.stringify(entity),
    };
    const url = `${this.ngsiEndpoint}entities/${encodeURIComponent(memberURI)}/attrs`;

    const response = await this.fetcher.fetch(url, requestInit);

    if (response.ok) {
      updated = response.ok;
    }

    if (updated) {
      console.log('Succesfully updated entity in broker');
    } else {
      console.log(`Something went wrong: ${response.statusText}`);
    }

    return updated;
  }

  /**
   * Initializes the backend system by creating tables, counters and/or enabling plugins
   */
  public async provision(): Promise<void> {
    // Nothing to provision here
    console.log('provision');
  }

  /**
   * Stops asynchronous operations
   */
  public async stop(): Promise<void> {
    //
  }
}
