const config = require('../../config'),
  expect = require('chai').expect,
  accountModel = require('../../models/accountModel'),
  ipcExec = require('../helpers/ipcExec'),
  bcoin = require('bcoin'),
  _ = require('lodash');

module.exports = (ctx) => {


  it('validate balance', async () => {
    let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
    let coins = await ipcExec('getcoinsbyaddress', [keyring.getAddress().toString()]);

    ctx.summ = _.chain(coins)
      .map(c => c.value)
      .sum()
      .value();
  });

  it('generate blocks and initial coins', async () => {
    let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
    let response = await ipcExec('generatetoaddress', [10, keyring.getAddress().toString()]);
    expect(response).to.not.be.undefined;
  });

  it('validate balance again', async () => {
    let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
    let coins = await ipcExec('getcoinsbyaddress', [keyring.getAddress().toString()]);

    let newSumm = _.chain(coins)
      .map(c => c.value)
      .sum()
      .value();

    expect(newSumm).to.be.gt(ctx.summ);

  });

};