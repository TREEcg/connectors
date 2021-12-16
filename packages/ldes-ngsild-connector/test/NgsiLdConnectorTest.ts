import type { LdesShape } from '@treecg/ldes-types';
import type { IConfigNgsiLdConnector } from '../lib/NgsiLdConnector';
import { NgsiLdConnector } from '../lib/NgsiLdConnector';
import NgsiLdConnectorWithRequire = require('../lib/NgsiLdConnector');

describe('NgsiLdConnector', () => {
  const ldesUrl = 'https://apidg.gent.be/opendata/adlib2eventstream/v1/dmg/objecten';
  const config: IConfigNgsiLdConnector = {
    amountOfVersions: 0,
    ngsiEndpoint: 'https://rc.obelisk.ilabt.imec.be/api/v3/ext/ngsi/61928c6cf91b09530b04fe8a/ngsi-ld/v1/',
  };
  const defaultShape: LdesShape = [
    {
      path: '@id',
      datatype: 'https://www.w3.org/ns/shacl#IRI',
    },
    {
      path: '@type',
      datatype: 'https://www.w3.org/ns/shacl#IRI',
    },
  ];

  it('should be a function', () => {
    expect(NgsiLdConnector).toBeInstanceOf(Function);
  });

  it('should be an NgsiLdConnector constructor', () => {
    expect(new NgsiLdConnector(config, defaultShape, '1')).toBeInstanceOf(NgsiLdConnector);
  });

  it('should work with require', () => {
    expect(new NgsiLdConnectorWithRequire.NgsiLdConnector(config, defaultShape, '1')).toBeInstanceOf(NgsiLdConnector);
  });
});
