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

  let coins = await new Promise((res, rej) => {
    ipc.of[config.bitcoin.ipcName].on('message', data => data.error ? rej(data.error) : res(data.result));
    ipc.of[config.bitcoin.ipcName].emit('message', JSON.stringify({
      method: 'getcoinsbyaddress',
      params: [address]
    })
    );
  });

  let height = await new Promise((res, rej) => {
    ipc.of[config.bitcoin.ipcName].on('message', data => data.error ? rej(data.error) : res(data.result));
    ipc.of[config.bitcoin.ipcName].emit('message', JSON.stringify({
      method: 'getblockcount',
      params: []
    })
    );
  });

  let coinHeight = _.chain(coins)
    .sortBy('height')
    .last()
    .get('height')
    .value();

  let sum = _.chain(coins)
    .map(coin => coin.value)
    .sum()
    .defaultTo(0)
    .value();

  let balances = {};

  if (height - coinHeight >= 6) {
    _.merge(balances, {confirmations0: sum, confirmations3: sum, confirmations6: sum});
  }

  if (3 <= height - coinHeight && height - coinHeight  < 6) {
    _.merge(balances, {confirmations0: sum, confirmations3: sum});
  }

  if (height - coinHeight < 3) {
    _.merge(balances, {confirmations0: sum});
  }

  ipc.disconnect(config.bitcoin.ipcName);

  return {
    balances: balances,
    lastBlockCheck: height
  };

};
