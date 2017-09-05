const Promise = require('bluebird'),
  ipc = require('node-ipc'),
  _ = require('lodash'),
  config = require('../../../config');

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

  ipc.disconnect(config.bitcoin.ipcName);

  return coins.map(coin => ({
    address: coin.address,
    txid: coin.hash,
    scriptPubKey: coin.script,
    amount: coin.value / 100000000,
    satoshis: coin.value,
    height: coin.height,
    confirmations: height - coin.height
  }));
};
