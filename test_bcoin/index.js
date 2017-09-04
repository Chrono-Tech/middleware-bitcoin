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

  let height = await new Promise(res => {
    ipc.of.bitcoin.on('message', res);
    ipc.of.bitcoin.emit('message', JSON.stringify({
        method: 'getblockcount',
        params: []
      })
    );
  });


let sortedCoins = _.chain(coins.result)
  .sortBy('height')
  .reverse()
  .value();

console.log(sortedCoins);

let balances = {
  '0': _.chain(sortedCoins)
    .map(coin=>coin.value)
    .sum()
    .defaultTo(0)
    .value(),
  '3': _.chain(sortedCoins)
    .filter(coin=>coin.height <= height.result - 3)
    .map(coin=>coin.value)
    .sum()
    .defaultTo(0)
    .value(),
  '6': _.chain(sortedCoins)
    .filter(coin=>coin.height <= height.result - 6)
    .map(coin=>coin.value)
    .sum()
    .defaultTo(0)
    .value()
};


  console.log(balances);

};

module.exports = init();