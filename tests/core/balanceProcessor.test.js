const config = require('../../config'),
  expect = require('chai').expect,
  accountModel = require('../../models/accountModel'),
  ipcExec = require('../helpers/ipcExec'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  shared = require('../shared'),
  ctx = {
    addresses: {},
    generatedTxs: []
  };

module.exports = () => {

  it('remove registered address from mongodb', async () =>
    await accountModel.remove({address: config.bitcoin.coinbase[0]})
  );


  it('validate balance', async () => {
    let coins = await ipcExec('getcoinsbyaddress', [config.bitcoin.coinbase[0]]);

    ctx.summ = _.chain(coins)
      .map(c => c.value)
      .sum()
      .value();
  });

  it('register new address', async () => {
    await new accountModel({address: config.bitcoin.coinbase[0]})
      .save().catch(()=>{});
  });

  it('generate some coins for accountA', async () =>
    await ipcExec('generatetoaddress', [10, config.bitcoin.coinbase[0]])
  );

  it('validate balance for account in mongodb', async () => {
    await Promise.delay(2000);
    let account = await accountModel.findOne({address: config.bitcoin.coinbase[0]});
    expect(account.balances.confirmations0).to.be.gt(0);
  });

};