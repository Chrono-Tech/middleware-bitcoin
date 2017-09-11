const Promise = require('bluebird'),
  ipc = require('node-ipc'),
  config = require('../../../config');

/**
 * @service
 * @description get balances for an address
 * @param tx - raw transaction
 * @returns {Promise.<[{balances, lastBlockCheck}]>}
 */

module.exports = async tx => {

  Object.assign(ipc.config, {
    id: config.bitcoin.ipcName,
    socketRoot: config.bitcoin.ipcPath,
    retry: 1500,
    sync: true,
    silent: true
  });

  await new Promise(res => {
    ipc.connectTo(config.bitcoin.ipcName, () => {
      ipc.of[config.bitcoin.ipcName].on('connect', res);
    });
  });


  let result = await new Promise((res, rej) => {
    ipc.of[config.bitcoin.ipcName].on('message', data => data.error ? rej(data.error) : res(data.result));
    ipc.of[config.bitcoin.ipcName].emit('message', JSON.stringify({
      method: 'sendrawtransaction',
      params: [tx]
    })
    );
  });


  ipc.disconnect(config.bitcoin.ipcName);

  return result;

};
