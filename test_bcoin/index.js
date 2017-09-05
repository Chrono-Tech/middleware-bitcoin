const ipc = require('node-ipc'),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib'),
  bcoin = require('bcoin'),
  TX = require('bcoin/lib/primitives/tx'),
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

  let wiff = 'cRybMaH8rpHbWW47q3KZNpF5gSiANvzZf99pgvQnemvM6hoF5xBe';
  let wiff2 = 'cR9txJW5BP9XX9R3hDsfyhaJ95jQ6zPVMwfSYmTZknR2W2Hp5eFR';
  let keyPair = bitcoin.ECPair.fromWIF(wiff, bitcoin.networks.testnet);
  let keyPair2 = bitcoin.ECPair.fromWIF(wiff2, bitcoin.networks.testnet);

  var tx = new bitcoin.TransactionBuilder(bitcoin.networks.testnet, 100);
  var txId = '9470cd6658db6eb237006b876353d6d960fe89244638155048d4b18ac42a1fb7';
  tx.addInput(txId, 0);
  tx.addOutput(keyPair2.getAddress(), 1 / 10^9);
  tx.sign(0, keyPair);


  let hex = tx.build().toHex();

  let decodedTx  = TX.fromRaw(hex, 'hex');


  console.log(decodedTx.toJSON());
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