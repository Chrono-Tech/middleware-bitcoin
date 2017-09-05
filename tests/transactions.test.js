const config = require('../config'),
  Promise = require('bluebird'),
  awaitLastBlock = require('./helpers/awaitLastBlock'),
  mongoose = require('mongoose'),
  transactionModel = require('../models/transactionModel'),
  accountModel = require('../models/accountModel'),
  bitcoin = Promise.promisifyAll(require('bitcoin')),
  request = require('request'),
  ctx = {
    client: null,
    account: '',
    address: '',
    generatedTxs: []
  };

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000 * 7;

beforeAll(async() => {
  ctx.client = new bitcoin.Client(config.bitcoin);
  mongoose.connect(config.mongo.uri);
  return await awaitLastBlock(ctx.client);
});

afterAll(() => {
  return mongoose.disconnect();
});

test('generate blocks and initial coins', async() => {
  let result = await ctx.client.generateAsync(101);
  expect(result).toBeDefined();
});

test('generate new address', async() => {
  ctx.account = 'super_test';
  ctx.address = await ctx.client.getAccountAddressAsync(ctx.account);
  expect(ctx.address).toBeDefined();
});

test('register new account', async() => {
  return new Promise((res, rej) =>
    request({
      method: 'post',
      body: {
        account: ctx.account
      },
      json: true,
      url: `http://localhost:${config.rest.port}/transactions/account`
    }, (err, resp, body) => {
      err || resp.statusCode !== 200 ? rej(err) : res(body)
    })
  )
});

test('send tokens', async() => {
  let result = await ctx.client.sendToAddressAsync(ctx.address, 1);
  expect(result).toBeDefined();
});

test('generate new block with sent tokens tx', async() => {
  ctx.generatedTxs = await ctx.client.generateAsync(10);
  expect(ctx.generatedTxs).toBeDefined();
});

test('validate tx in mongodb', async() => {
  await Promise.delay(60000 * 5);
  let tx = await transactionModel.findOne({
    format: {
      txid: {$in: ctx.generatedTxs}
    }
  });

  expect(tx).toBeDefined();

});


test('validate balance in mongodb', async() => {
  let tx = await accountModel.findOne({account: ctx.account});
  expect(tx.balance).toBeGreaterThan(0);

});