import { Ngsildify } from '@brechtvdv/rdfs2ngsi-ld.js';
import type { IConfigConnector, IWritableConnector, LdesShape } from '@treecg/ldes-types';
import fetch from 'node-fetch';
import OpenIdFetcher from './OpenIdFetcher';

export interface IConfigNgsiLdConnector extends IConfigConnector {
  ngsiEndpoint: string;
  clientId?: string;
  clientSecret?: string;
  tokenEndpoint?: string;
}

export class NgsiLdConnector implements IWritableConnector {
  private readonly members: any[];
  private readonly fetch: any;
  private readonly ngsiEndpoint: string;
  /**
   * Templates for the backend generator.
   */
  public static composeTemplate = ``;

  public static helmTemplate = ``;

  public constructor(config: IConfigNgsiLdConnector, shape: LdesShape, id: string) {
    this.members = [];
    console.log('Shape:' + shape);
    this.ngsiEndpoint = config.ngsiEndpoint;

    if (config.clientId && config.clientSecret && config.tokenEndpoint) {
      this.fetch = new OpenIdFetcher(config.clientId, config.clientSecret, config.tokenEndpoint);
      this.initOpenIdFetcher();
    } else {
      this.fetch = fetch;
    }
  }

  private initOpenIdFetcher() {
    this.fetch.initToken();
  }

  /**
   * Writes a version to the corresponding backend system
   * @param member
   */
  public async writeVersion(member: any): Promise<void> {
    console.log('write version');
    const ngsildify = new Ngsildify();
    const objectNgsi = await ngsildify.transform(member);
    const headers = {
      'Content-Type': 'application/ld+json',
    };
    const url = `${this.ngsiEndpoint}entityOperations/create`;

    this.fetch.fetch(url, objectNgsi, headers);
    console.log('Succesfully created entity in broker');
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
