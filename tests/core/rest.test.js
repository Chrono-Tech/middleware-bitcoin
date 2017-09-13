const config = require('../../config'),
  expect = require('chai').expect,
  accountModel = require('../../models/accountModel'),
  ipcExec = require('../helpers/ipcExec'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  request = Promise.promisify(require('request')),
  bcoin = require('bcoin'),
  Coin = require('bcoin/lib/primitives/coin'),
  shared = require('../shared'),
  scope = {};

module.exports = (ctx) => {

  it('remove registered addresses from mongodb', async () => {

    let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
    let keyring2 = new bcoin.keyring(ctx.accounts[1].privateKey, ctx.network);
    let keyring3 = new bcoin.keyring(ctx.accounts[2].privateKey, ctx.network);

    return await accountModel.remove({
      address: {
        $in: [keyring.getAddress().toString(), keyring2.getAddress().toString(), keyring3.getAddress().toString()]
      }
    })
  });

  it('register addresses', async () => {

    let responses = await Promise.all(ctx.accounts.map(account => {
      let keyring = new bcoin.keyring(account.privateKey, ctx.network);
      return request({
        url: `http://${config.rest.domain}:${config.rest.port}/addr`,
        method: 'post',
        json: {
          address: keyring.getAddress().toString()
        }
      })

    }));

    responses.forEach(resp =>
      expect(resp.body).to.include({success: true})
    )
  });

  it('generate some coins for accountA', async () => {
    let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
    return await ipcExec('generatetoaddress', [50, keyring.getAddress().toString()])
  });

  it('send coins to accountB and accountC', async () => {

    let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
    let keyring2 = new bcoin.keyring(ctx.accounts[1].privateKey, ctx.network);
    let keyring3 = new bcoin.keyring(ctx.accounts[2].privateKey, ctx.network);
    let coins = await ipcExec('getcoinsbyaddress', [keyring.getAddress().toString()]);
    let height = await ipcExec('getblockcount', []);

    let inputCoins = _.chain(coins)
      .transform((result, coin) => {
        if (height - coin.height < 6)
          return;

        result.coins.push(Coin.fromJSON(coin));
        result.amount += coin.value;
      }, {amount: 0, coins: []})
      .value();

    console.log(inputCoins.amount);

    const mtx = new bcoin.mtx();

    mtx.addOutput({
      address: keyring2.getAddress(),
      value: Math.pow(10, 8)
    });

    mtx.addOutput({
      address: keyring3.getAddress(),
      value: Math.pow(10, 8)
    });

    await mtx.fund(inputCoins.coins, {
      rate: 10000,
      changeAddress: keyring.getAddress()
    });

    mtx.sign(keyring);

    const tx = mtx.toTX();

    scope.mtx = mtx;

    let response = await request({
      url: `http://${config.rest.domain}:${config.rest.port}/tx/send`,
      method: 'post',
      json: {
        tx: tx.toRaw().toString('hex')
      }
    });

    expect(response.body).to.be.a('string');

  });

  it('validate potential balance changes for accounts', async () => {
    let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
    let keyring2 = new bcoin.keyring(ctx.accounts[1].privateKey, ctx.network);
    let keyring3 = new bcoin.keyring(ctx.accounts[2].privateKey, ctx.network);

    let accountA = await accountModel.findOne({address: keyring.getAddress().toString()});
    let accountB = await accountModel.findOne({address: keyring2.getAddress().toString()});
    let accountC = await accountModel.findOne({address: keyring3.getAddress().toString()});

    let diffA = _.get(accountA, 'balances.confirmations6', 0) - _.get(accountA, 'balances.confirmations0', 0);
    let diffB = _.get(accountB, 'balances.confirmations0', 0) - _.get(accountB, 'balances.confirmations6', 0);
    let diffC = _.get(accountC, 'balances.confirmations0', 0) - _.get(accountC, 'balances.confirmations6', 0);

    expect(diffB + diffC + scope.mtx.getFee()).to.equal(diffA);

  });

  /*
   it('generate some coins for accountD', async () => {
   let keyring = new bcoin.keyring(ctx.accounts[2].privateKey, ctx.network);
   return await ipcExec('generatetoaddress', [10, keyring.getAddress().toString()])
   });
   */

  /*

   it('generate some coins for accountB', async () => {
   let keyring = new bcoin.keyring(ctx.accounts[1].privateKey, ctx.network);
   return await ipcExec('generatetoaddress', [100, keyring.getAddress().toString()])
   });

   it('validate balance for account in mongodb', async () => {
   await Promise.delay(10000);
   let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
   let account = await accountModel.findOne({address: keyring.getAddress().toString()});
   scope.amountA = account.balances.confirmations0;
   expect(account.balances.confirmations0).to.be.gt(0);
   });

   it('send coins to accountB and accountC', async () => {

   let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
   let keyring2 = new bcoin.keyring(ctx.accounts[1].privateKey, ctx.network);
   let keyring3 = new bcoin.keyring(ctx.accounts[2].privateKey, ctx.network);
   let coins = await ipcExec('getcoinsbyaddress', [keyring.getAddress().toString()]);

   let inputCoins = _.chain(coins)
   .transform((result, coin) => {
   result.coins.push(Coin.fromJSON(coin));
   result.amount += coin.value;
   }, {amount: 0, coins: []})
   .value();

   const mtx = new bcoin.mtx();

   mtx.addOutput({
   address: keyring2.getAddress(),
   value: Math.round(inputCoins.amount * 0.2)
   });

   mtx.addOutput({
   address: keyring3.getAddress(),
   value: Math.round(inputCoins.amount * 0.5)
   });

   await mtx.fund(inputCoins.coins, {
   rate: 10000,
   changeAddress: keyring.getAddress()
   });

   mtx.sign(keyring);

   const tx = mtx.toTX();
   return await ipcExec('sendrawtransaction', [tx.toRaw().toString('hex')]);
   });

   it('generate some coins for accountB', async () => {
   let keyring = new bcoin.keyring(ctx.accounts[1].privateKey, ctx.network);
   return await ipcExec('generatetoaddress', [10, keyring.getAddress().toString()])
   });

   it('validate balance for all accounts in mongodb', async () => {
   await Promise.delay(10000);
   let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
   let account = await accountModel.findOne({address: keyring.getAddress().toString()});
   expect(account.balances.confirmations0).to.be.lt(scope.amountA);
   });
   */

};