const ipc = require('node-ipc'),
  _ = require('lodash'),
  config = require('../config');

Object.assign(ipc.config, {
  id: config.bitcoin.ipcName,
  retry: 1500,
  silent: true
});

const init = async () => {

  await new Promise(res => {
    ipc.connectTo('bitcoin', () => {
      ipc.of.bitcoin.on('connect', res);

      ipc.of.bitcoin.on('disconnect', () => {
        process.exit(-1);
      });

    });
  });

  let coins = await new Promise(res => {
    ipc.of.bitcoin.on('message', res);
    ipc.of.bitcoin.emit('message', JSON.stringify({
        method: 'getcoinsbyaddress',
        params: ['mobEo1ujMWMQiQ2fQQ3UzLUxFUh6tLNEVd']
      })
    );
  });

  console.log(coins.result[0]);

  let height = await new Promise(res => {
    ipc.of.bitcoin.on('message', res);
    ipc.of.bitcoin.emit('message', JSON.stringify({
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

  console.log(coinHeight);

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

  console.log(height.result - coinHeight);
  if (height.result - coinHeight >= 6)
    _.merge(balances, {confirmations0: sum, confirmations3: sum, confirmations6: sum});

  if (3 <= height.result - coinHeight < 6)
    _.merge(balances, {confirmations0: sum, confirmations3: sum});

  if (height.result - coinHeight < 3)
    _.merge(balances, {confirmations0: sum});


  console.log(balances);

};

module.exports = init();