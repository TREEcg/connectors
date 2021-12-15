import fetch from 'node-fetch';
const interval = require('interval-promise');

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
    const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const headersPost = {
      Authorization: `Basic ${authString}`,
      'Content-type': 'application/json',
    };

    await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: headersPost,
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    })
      .then(res => res.json())
      .then((json: any) => {
        if (json.access_token) {
          this.accessToken = json.access_token;
        } else {
          throw new Error('Access Token not available');
        }
      })
      .catch(error => console.error(error));
  }

  public async fetch(url: string, body: object, headers: object): Promise<any> {
    let headersPost = {
      Authorization: `Bearer ${this.accessToken}`,
    };
    headersPost = { ...headersPost, ...headers };

    await fetch(url, {
      method: 'POST',
      headers: headersPost,
      body: JSON.stringify(body),
    })
      .then((res: { json: () => any }) => res.json())
      .then(json => {
        if (json.errors && json.errors[0] && json.errors[0].error && json.errors[0].error.title) {
          for (const error in json.errors) {
            console.error(json.errors[error].error.title);
          }
        } else if (json.type === 'https://uri.etsi.org/ngsi-ld/errors/InternalError' && json.title && json.detail) {
          console.error(`${json.title}: ${json.detail}`);
        }
        return json;
      })
      .catch(error => {
        console.error(error);
        return null;
      });
  }
}
