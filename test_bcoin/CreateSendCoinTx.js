const ipc = require('node-ipc'),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib'),
  bcoin = require('bcoin'),
  config = require('../config');

Object.assign(ipc.config, {
  id: config.bitcoin.ipcName,
  retry: 1500,
  silent: true
});


module.exports = async (from, to, amount, key) => {

  await new Promise(res => {
    ipc.connectTo('bitcoin', () => {
      ipc.of.bitcoin.on('connect', res);

      ipc.of.bitcoin.on('disconnect', () => {
        process.exit(-1);
      });

    });
  });

  let coins = await new Promise((res, rej) => {
    ipc.of.bitcoin.on('message', data => data.error ? rej() : res(data.result));
    ipc.of.bitcoin.emit('message', JSON.stringify({
      method: 'getcoinsbyaddress',
      params: [from]
    })
    );
  });

  let sortedCoins = _.chain(coins)
    .sortBy('height')
    .filter(c=>c.value >= amount * Math.pow(10, 8))
    .value();

  let inputCoin = sortedCoins[0].height === -1 ? sortedCoins[0] : _.last(sortedCoins);
  let tx = new bitcoin.TransactionBuilder(bitcoin.networks[config.bitcoin.network]);

  console.log(inputCoin);
  tx.addInput(inputCoin.hash, inputCoin.index);
  tx.addOutput(to, amount * Math.pow(10, 8));
  tx.addOutput(to, inputCoin.value - amount * Math.pow(10, 8));

  tx.sign(0, key);




  /*
  const cb = new bcoin.mtx();

  cb.addInput({
    prevout: new bcoin.outpoint(),
    script: new bcoin.script(),
    sequence: 0xffffffff
  });

  // Send 50,000 satoshis to ourselves.
  cb.addOutput({
    address: to,
    value: amount * Math.pow(10, 8)
  });



  const coin = bcoin.coin.fromTX(cb, 0, -1);
  coins.push(coin);
  const mtx = new bcoin.mtx();

*/



  ipc.disconnect(config.bitcoin.ipcName);

  return tx.build().toHex();

};
