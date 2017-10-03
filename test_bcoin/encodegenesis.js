const crypto = require('crypto'),
  Block = require('bcoin/lib/primitives/block'),
  util = require('bcoin/lib/utils/util');

let block = {
  version: 1,
  hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
  prevBlock: '0000000000000000000000000000000000000000000000000000000000000000',
  merkleRoot: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
  time: 1231006505,
  bits: 486604799,
  nonce: 2083236893,
  height: 0,
  txs: [
    {
      hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      witnessHash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      size: 204,
      virtualSize: 204,
      value: '50.0',
      fee: '0.0',
      rate: '0.0',
      minFee: '0.00000204',
      height: -1,
      block: null,
      time: 0,
      date: null,
      index: 0,
      version: 1,
      inputs: [{
        prevout: {
          hash: '0000000000000000000000000000000000000000000000000000000000000000',
          index: 4294967295
        },
        script: '04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73',
        witness: '00',
        sequence: 4294967295,
        address: null,
        coin: undefined
      }],
      outputs: [{
        value: 5000000000,
        script: '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      }],
      locktime: 0
    }
  ]
};

const encoded = '0100000000000000000000000000000000000000000000000000000000000000000000'
  + '003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab'
  + '5f49ffff001d1dac2b7c01010000000100000000000000000000000000000000000000'
  + '00000000000000000000000000ffffffff4d04ffff001d0104455468652054696d6573'
  + '2030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66'
  + '207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01'
  + '000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f'
  + '61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  + 'ac00000000';

/*
let header_hex = Block.fromRaw(encoded, 'hex');

console.log(header_hex.toJSON().txs[0].outputs)*/


let header_hex =Block.fromJSON(block);

console.log(header_hex.toRaw().toString('hex') === encoded);
console.log(header_hex.toRaw().toString('hex').length, encoded.length);