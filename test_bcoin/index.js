const ipc = require('node-ipc'),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib'),
  bcoin = require('bcoin'),
  Network = require('bcoin/lib/protocol/network'),
  TX = require('bcoin/lib/primitives/tx'),
  config = require('../config');

Object.assign(ipc.config, {
  id: config.bitcoin.ipcName,
  retry: 1500,
  silent: true
});

const init = async () => {

/*  await new Promise(res => {
    ipc.connectTo('bitcoin_reg', () => {
      ipc.of.bitcoin.on('connect', res);

      ipc.of.bitcoin.on('disconnect', () => {
        process.exit(-1);
      });

    });
  });*/

  let wiff = 'cRybMaH8rpHbWW47q3KZNpF5gSiANvzZf99pgvQnemvM6hoF5xBe';
  let wiff2 = 'cR9txJW5BP9XX9R3hDsfyhaJ95jQ6zPVMwfSYmTZknR2W2Hp5eFR';
  let wiff3 = 'cVeywUPfsJ3hHDoUC7n9ECEkfyKy3yorKmBvB1USY1sQehaWvU82';
  let keyPair = bitcoin.ECPair.fromWIF(wiff, bitcoin.networks.testnet);
  let keyPair2 = bitcoin.ECPair.fromWIF(wiff2, bitcoin.networks.testnet);
  let keyPair3 = bitcoin.ECPair.fromWIF(wiff3, bitcoin.networks.testnet);

  console.log(keyPair.getAddress());
  console.log(keyPair2.getAddress());
  console.log(keyPair3.getAddress());

  let coins = await new Promise((res, rej) => {
    ipc.of.bitcoin.on('message', data => data.error ? rej() : res(data.result));
    ipc.of.bitcoin.emit('message', JSON.stringify({
      method: 'getcoinsbyaddress',
      params: [keyPair.getAddress()]
    })
    );
  });


  let coins2 = await new Promise((res, rej) => {
    ipc.of.bitcoin.on('message', data => data.error ? rej() : res(data.result));
    ipc.of.bitcoin.emit('message', JSON.stringify({
        method: 'getcoinsbyaddress',
        params: [keyPair2.getAddress()]
      })
    );
  });

  console.log(coins);

  console.log('summ: ', _.chain(coins).map(c => c.value).sum().value());

  let sortedCoins = _.chain(coins)
    .sortBy('height')
    .value();

  let txId = sortedCoins[0].height === -1 ? sortedCoins[0].hash : _.last(sortedCoins).hash;

  //console.log(txId);

  var tx = new bitcoin.TransactionBuilder(bitcoin.networks.testnet, 100);
  /*  var txId = '9470cd6658db6eb237006b876353d6d960fe89244638155048d4b18ac42a1fb7'; //belong to k1
  var txId2 = '9470cd6658db6eb237006b876353d6d960fe89244638155048d4b18ac42a1fb7'; //belong to k2
  var txId3 = '9470cd6658db6eb237006b876353d6d960fe89244638155048d4b18ac42a1fb7'; //belong to k3*/

  tx.addInput(txId, 0);
  //tx.addInput(txId3, 1);
  //tx.addInput(txId3, 2);

  tx.addOutput(keyPair.getAddress(), 1 * Math.pow(10, 9));
  //tx.addOutput(keyPair.getAddress(), 3 * Math.pow(10, 9));
  //tx.addOutput(keyPair2.getAddress(), 123 * Math.pow(10, 9));

  //tx.sign(0, keyPair);
  tx.sign(0, keyPair2);
  ///tx.sign(1, keyPair3);
  //tx.sign(2, keyPair2);

  let hex = tx.build().toHex();
  let decodedTx = TX.fromRaw(hex, 'hex');
  let network = Network.get('testnet');
  decodedTx = decodedTx.getJSON(network);

  console.log(hex);

  /*let addressInBalance = 'mh2bbq9LDcHrXreN8RuyoUmJgWfLQgm5vg';

  let check = _.chain(decodedTx.outputs)
    .map((output, i) => ({
      from: decodedTx.inputs[i].address,
      to: output.address,
      amount: output.value
    }))
    .filter(d => d.from !== d.to)
    .value();

  let outComeBalance = _.chain(check)
    .filter({from: addressInBalance})
    .map(i => i.amount)
    .sum()
    .defaults(0)
    .value();

  let inComeBalance = _.chain(check)
    .filter({to: addressInBalance})
    .map(i => i.amount)
    .sum()
    .defaults(0)
    .value();

  console.log(inComeBalance - outComeBalance);*/

  /*


   let outputBalance = _.chain(decodedTx.outputs)
   .filter({address: keyPair2.getAddress()})
   // .map(i=>i.value)
   // .compact()
   // .sum()
   // .defaults(0)
   .value();

   console.log(decodedTx)

   //console.log(inputBalance - outputBalance);*/

  /*  let sendTx = await new Promise((res, rej) => {
   ipc.of.bitcoin.on('message', data => data.error ? rej() : res(data.result));
   ipc.of.bitcoin.emit('message', JSON.stringify({
   method: 'sendrawtransaction',
   params: [hex]
   })
   );
   });

   console.log(sendTx);*/

};

module.exports = init();
