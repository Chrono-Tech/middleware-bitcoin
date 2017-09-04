const Promise = require('bluebird'),
  ipc = require('node-ipc'),
  config = require('../../config'),
  _ = require('lodash');

/**
 * @service
 * @description get balances for each account
 * @param accounts - fetched accounts from mongodb
 * @returns {Promise.<[{balance, account}]>}
 */

module.exports = async address => {

  Object.assign(ipc.config, {
    id: Date.now(),
    retry: 1500,
    sync: true,
    silent: true
  });

  await new Promise(res => {
    ipc.connectTo(config.bitcoin.ipcName, () => {
      ipc.of[config.bitcoin.ipcName].on('connect', res);
    });
  });

  let coins = await new Promise(res => {
    ipc.of[config.bitcoin.ipcName].on('message', res);
    ipc.of[config.bitcoin.ipcName].emit('message', JSON.stringify({
        method: 'getcoinsbyaddress',
        params: [address]
      })
    );
  });

  let height = await new Promise(res => {
    ipc.of[config.bitcoin.ipcName].on('message', res);
    ipc.of[config.bitcoin.ipcName].emit('message', JSON.stringify({
        method: 'getblockcount',
        params: []
      })
    );
  });

  let sortedCoins = _.chain(coins.result)
    .sortBy('height')
    .reverse()
    .value();

  ipc.disconnect(config.bitcoin.ipcName);

  return {
    balances: {
      confirmations0: _.chain(sortedCoins)
        .map(coin => coin.value)
        .sum()
        .defaultTo(0)
        .value(),
      confirmations3: _.chain(sortedCoins)
        .filter(coin => coin.height <= height.result - 3)
        .map(coin => coin.value)
        .sum()
        .defaultTo(0)
        .value(),
      confirmations6: _.chain(sortedCoins)
        .filter(coin => coin.height <= height.result - 6)
        .map(coin => coin.value)
        .sum()
        .defaultTo(0)
        .value()
    },
    lastBlockCheck: height.result
  };

};
