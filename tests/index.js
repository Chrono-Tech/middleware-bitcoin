require('dotenv/config');

const config = require('../config'),
  path = require('path'),
  require_all = require('require-all'),
  coreTests = require_all({
    dirname: path.join(__dirname, 'core'),
    filter: /(.+test)\.js$/,
    map: name => name.replace('.test', '')
  }),
  mongoose = require('mongoose');

mongoose.Promise = Promise;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('tests', function () {

  before(async () => {
    mongoose.connect(config.mongo.uri, {useMongoClient: true});
  });

  after(() => {
    return mongoose.disconnect();
  });

  describe('core/blockProcessor', coreTests.blockProcessor);

  describe('core/balanceProcessor', coreTests.balanceProcessor);

});
