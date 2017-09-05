const ipc = require('node-ipc'),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib'),
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

  var keyPair = bitcoin.ECPair.makeRandom();
  console.log(keyPair.toWIF());
  console.log(keyPair.getAddress());


  var tx = new bitcoin.TransactionBuilder();

  var txId = 'aa94ab02c182214f090e99a0d57021caffd0f195a81c24602b1028b130b63e31'
  tx.addInput(txId, 0);

  tx.addOutput(keyPair.getAddress(), 15000);
  tx.sign(0, keyPair);
  console.log(tx.build().toHex());


  /*
   let sendTx = await new Promise((res, rej) => {
   ipc.of.bitcoin.on('message', data=>  data.error ? rej() : res(data.result));
   ipc.of.bitcoin.emit('message', JSON.stringify({
   method: 'sendrawtransaction',
   params: ['mobEo1ujMWMQiQ2fQQ3UzLUxFUh6tLNEVd']
   })
   );
   });*/

};

module.exports = init();