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


  const ipcInstance = new ipc.IPC;

  Object.assign(ipcInstance.config, {
    id: Date.now(),
    socketRoot: config.bitcoin.ipcPath,
    retry: 1500,
    sync: true,
    silent: true,
    unlink: false
  });


  await new Promise(res => {
    ipcInstance.connectTo(config.bitcoin.ipcName, () => {
      ipcInstance.of[config.bitcoin.ipcName].on('connect', res);
    });
  });

  let coins = await new Promise((res, rej) => {
    ipcInstance.of[config.bitcoin.ipcName].on('message', data => data.error ? rej(data.error) : res(data.result));
    ipcInstance.of[config.bitcoin.ipcName].emit('message', JSON.stringify({
      method: 'getcoinsbyaddress',
      params: [address]
    })
    );
  });

  let height = await new Promise((res, rej) => {
    ipcInstance.of[config.bitcoin.ipcName].on('message', data => data.error ? rej(data.error) : res(data.result));
    ipcInstance.of[config.bitcoin.ipcName].emit('message', JSON.stringify({
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

  ipcInstance.disconnect(config.bitcoin.ipcName);

  return {
    balances: balances,
    lastBlockCheck: height
  };

};
