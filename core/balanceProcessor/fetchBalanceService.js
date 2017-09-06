const Promise = require('bluebird'),
  ipc = require('node-ipc'),
  config = require('../../config'),
  _ = require('lodash');

/**
 * @service
 * @description get balances for an address
 * @param address - registered address
 * @returns {Promise.<[{balances, lastBlockCheck}]>}
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

  let coinHeight = _.chain(coins.result)
    .sortBy('height')
    .last()
    .get('height')
    .value();

  let sum = _.chain(coins.result)
    .map(coin => coin.value)
    .sum()
    .defaultTo(0)
    .value();

  let balances = {
    confirmations0: 0,
    confirmations3: 0,
    confirmations6: 0
  };

  if (height.result - coinHeight >= 6)
    _.merge(balances, {confirmations0: sum, confirmations3: sum, confirmations6: sum});

  if (3 <= height.result - coinHeight < 6)
    _.merge(balances, {confirmations0: sum, confirmations3: sum});

  if (height.result - coinHeight < 3)
    _.merge(balances, {confirmations0: sum});

  ipc.disconnect(config.bitcoin.ipcName);

  return {
    balances: balances,
    lastBlockCheck: height.result
  };

};
