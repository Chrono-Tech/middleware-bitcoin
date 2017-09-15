const ipc = require('node-ipc'),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib'),
  bcoin = require('bcoin'),
  Network = require('bcoin/lib/protocol/network'),
  TX = require('bcoin/lib/primitives/tx'),
  CreateSendCoinTx = require('./CreateSendCoinTx'),
  config = require('../config');

Object.assign(ipc.config, {
  id: config.bitcoin.ipcName,
  retry: 1500,
  silent: true
});

const init = async () => {

  let wiff = 'cRybMaH8rpHbWW47q3KZNpF5gSiANvzZf99pgvQnemvM6hoF5xBe';
  let wiff2 = 'cR9txJW5BP9XX9R3hDsfyhaJ95jQ6zPVMwfSYmTZknR2W2Hp5eFR';
  let keyPair = bitcoin.ECPair.fromWIF(wiff, bitcoin.networks.testnet);
  let keyPair2 = bitcoin.ECPair.fromWIF(wiff2, bitcoin.networks.testnet);

  console.log(keyPair.getAddress());
  console.log(keyPair2.getAddress());


  let tx = await CreateSendCoinTx(keyPair.getAddress(), keyPair2.getAddress(), 0.1, keyPair);
  console.log(tx);


};

module.exports = init();
