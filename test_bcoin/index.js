const ipc = require('node-ipc'),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib'),
  bcoin = require('bcoin'),
  Network = require('bcoin/lib/protocol/network'),
  TX = require('bcoin/lib/primitives/tx'),
  config = require('../core/middleware-bitcoin-blockprocessor/config');

Object.assign(ipc.config, {
  retry: 1500,
  silent: true
});

const init = async () => {

  await new Promise(res => {
    ipc.connectTo(config.bitcoin.ipcName, () => {
      ipc.of[config.bitcoin.ipcName].on('connect', res);
    });
  });

  let wiff = 'cRybMaH8rpHbWW47q3KZNpF5gSiANvzZf99pgvQnemvM6hoF5xBe';
  let wiff2 = 'cR9txJW5BP9XX9R3hDsfyhaJ95jQ6zPVMwfSYmTZknR2W2Hp5eFR';
  let keyPair = bitcoin.ECPair.fromWIF(wiff, bitcoin.networks.testnet);
  let keyPair2 = bitcoin.ECPair.fromWIF(wiff2, bitcoin.networks.testnet);

  console.log(keyPair.getAddress());
  console.log(keyPair2.getAddress());

  let coins = await new Promise((res, rej) => {
    ipc.of[config.bitcoin.ipcName].on('message', data => data.error ? rej() : res(data.result));
    ipc.of[config.bitcoin.ipcName].emit('message', JSON.stringify({
        method: 'getcoinsbyaddress',
        params: [keyPair.getAddress()]
      })
    );
  });

  //console.log(coins);

  console.log('summ: ', _.chain(coins).map(c => c.value).sum().value());

  let sortedCoins = _.chain(coins)
    .filter(c=>c.height !== -1)
    .sortBy('height')
    .value();

  let txId = sortedCoins[0].height === -1 ? sortedCoins[0].hash : _.last(sortedCoins).hash;
  let amount = sortedCoins[0].height === -1 ? sortedCoins[0].value : _.last(sortedCoins).value;

  //console.log(txId);

  let tx = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  tx.addInput(txId, 0);

  //console.log(amount);
  tx.addOutput(keyPair2.getAddress(), amount - 10000);

  tx.sign(0, keyPair);

  let hex = tx.build().toHex();

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
