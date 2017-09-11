const config = require('../../config'),
  expect = require('chai').expect,
  accountModel = require('../../models/accountModel'),
  ipcExec = require('../helpers/ipcExec'),
  _ = require('lodash'),
  ctx = {};

module.exports = () => {

  it('validate balance', async () => {
    let coins = await ipcExec('getcoinsbyaddress', [config.bitcoin.coinbase[0]]);

    ctx.summ = _.chain(coins)
      .map(c => c.value)
      .sum()
      .value();
  });

  it('generate blocks and initial coins', async () => {
    let response = await ipcExec('generatetoaddress', [10, config.bitcoin.coinbase[0]]);
    expect(response).to.not.be.undefined;
  });

  it('validate balance again', async () => {
    let coins = await ipcExec('getcoinsbyaddress', [config.bitcoin.coinbase[0]]);

    let newSumm = _.chain(coins)
      .map(c => c.value)
      .sum()
      .value();

    expect(newSumm).to.be.gt(ctx.summ);

  });

};