require('dotenv/config');

const config = require('../config'),
  path = require('path'),
  require_all = require('require-all'),
  coreTests = require_all({
    dirname: path.join(__dirname, 'core'),
    filter: /(.+test)\.js$/,
    map: name => name.replace('.test', '')
  }),
  Network = require('bcoin/lib/protocol/network'),
  bcoin = require('bcoin'),
  ctx= {
  network: null,
  accounts: []
  },
  mongoose = require('mongoose');

mongoose.Promise = Promise;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('tests', function () {

  before(async () => {

    ctx.network = Network.get('regtest');

    let keyPair = bcoin.hd.generate();
    let keyPair2 = bcoin.hd.generate();
    let keyPair3 = bcoin.hd.generate();

    ctx.accounts.push(keyPair, keyPair2, keyPair3);

    mongoose.connect(config.mongo.uri, {useMongoClient: true});
  });

  after(() => {
    return mongoose.disconnect();
  });

  describe('core/blockProcessor', () => coreTests.blockProcessor(ctx));

  describe('core/balanceProcessor', () => coreTests.balanceProcessor(ctx));

  describe('core/rest', () => coreTests.rest(ctx));

});
