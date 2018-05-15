# node-license-client
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

Client module for node-license-server

## Installation 

```
npm i node-license-client
```

## Get Started

```
const LicenseClient = require('node-license-client')
const options = {
  certHex: '',                 // hex of public.pem, not required if pemPath is specified
  pemPath: 'public.pem',       // path of public.pem, not required if certHex is provided
  identity: 'Client Software', // identify of the client software 
  secret: 'Client Software',   // optional(unique secret to identify physical machine, please refer to `machine-digest`)
  keyFilePath: '',             // path of license key, default is 'key.txt'
  licenseFilePath: '',         // path of license file, defautl is 'license.txt'
  licenseServer: 'https://license-server/'  // license server address
}
const client = new LicenseClient(options)

// during app init
const init = async () => {
  await licensing.verify()
}

```

 
[npm-image]: https://img.shields.io/npm/v/node-license-client.svg
[npm-url]: https://npmjs.org/package/node-license-client
[travis-image]: https://img.shields.io/travis/devfans/node-license-client/master.svg
[travis-url]: https://travis-ci.org/devfans/node-license-client
[coveralls-image]: https://img.shields.io/coveralls/devfans/node-license-client/master.svg
[coveralls-url]: https://coveralls.io/r/devfans/node-license-client?branch=master
[downloads-image]: https://img.shields.io/npm/dm/node-license-client.svg
[downloads-url]: https://npmjs.org/package/node-license-client

