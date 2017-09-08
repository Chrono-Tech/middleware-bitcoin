const config = require('../config'),
  Promise = require('bluebird'),
  awaitLastBlock = require('./helpers/awaitLastBlock'),
  mongoose = require('mongoose'),
  transactionModel = require('../models/transactionModel'),
  accountModel = require('../models/accountModel'),
  request = Promise.promisify(require('request')),
  shared = require('./shared'),
  ctx = {
    rpc: {
      host: 'localhost',
      port: 48332
    },
    addresses: {},
    generatedTxs: []
  };

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000 * 7;


beforeAll(async () => {
  mongoose.connect(config.mongo.uri);
});

afterAll(() => {
  return mongoose.disconnect();
});

test('generate blocks and initial coins', async () => {

  let response = await request({
    method: 'post',
    uri: `http://${ctx.rpc.host}:${ctx.rpc.port}`,
    json: true,
    body: {
      method: "generatetoaddress",
      params: [100, shared.accountA.getAddress().toString()]
    }
  });

  expect(response).toBeDefined();
});

test('register new account', async () => {
  return await request({
    method: 'post',
    body: {
      address: shared.accountA.getAddress().toString()
    },
    json: true,
    url: `http://localhost:${config.rest.port}/addr`
  })
});


test('validate balance in mongodb', async () => {
  let account = await accountModel.findOne({address: shared.accountA.getAddress().toString()});
  ctx.addresses[shared.accountA.getAddress().toString()] = account.balances;
  expect(account.balances.confirmations0).toBeGreaterThan(0);
});


test('generate some coins for accountA', async () => {
  let response = await request({
    method: 'post',
    uri: `http://${ctx.rpc.host}:${ctx.rpc.port}`,
    json: true,
    body: {
      method: "generatetoaddress",
      params: [10, shared.accountA.getAddress().toString()]
    }
  });




});



/*
 test('send tokens', async () => {
 let result = await ctx.client.sendToAddressAsync(ctx.address, 1);
 expect(result).toBeDefined();
 });

 test('generate new block with sent tokens tx', async () => {
 ctx.generatedTxs = await ctx.client.generateAsync(10);
 expect(ctx.generatedTxs).toBeDefined();
 });

 test('validate tx in mongodb', async () => {
 await Promise.delay(60000 * 5);
 let tx = await transactionModel.findOne({
 format: {
 txid: {$in: ctx.generatedTxs}
 }
 });

 expect(tx).toBeDefined();

 });

 test('validate balance in mongodb', async () => {
 let tx = await accountModel.findOne({account: ctx.account});
 expect(tx.balance).toBeGreaterThan(0);

 });
 */
