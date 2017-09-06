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

  console.log(keyPair.getAddress());
  console.log(keyPair2.getAddress());

  let currentTx = '29f776183a3be30d3eabd88edae12fe74b7c2b91341a5488b017630f7eed8f61';

  let tx = await new Promise((res, rej) => {
    ipc.of.bitcoin.on('message', data => data.error ? rej(JSON.stringify(data.error)) : res(data.result));
    ipc.of.bitcoin.emit('message', JSON.stringify({
        method: 'getrawtransaction',
        params: [currentTx]
      })
    );
  });

  console.log(tx);

  let decodedTx = TX.fromRaw(tx, 'hex');

  console.log(decodedTx);

  let addresses = _.chain(_.union(decodedTx.inputs, decodedTx.outputs))
    .flattenDeep()
    .map(i => (i.getAddress() || '').toString())
    .compact()
    .uniq()
    .value();

  console.log(addresses)
  console.log(decodedTx.getAddresses());

  let network = Network.get('testnet');
  console.log(decodedTx.getJSON(network));

};

module.exports = init();