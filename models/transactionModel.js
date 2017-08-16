const mongoose = require('mongoose');

/** @model transactionModel
 *  @description block model - represents a block in eth
 */
const Transaction = new mongoose.Schema({
  blockNumber: {type: String},
  network: {type: mongoose.Schema.Types.Mixed},
  format: {
    txid: {type: String},
    version: {type: Number},
    locktime: {type: Number}
  },
  inputs: [{
    txid: {type: String},
    n: {type: Number},
    script: {type: String},
    sequence: {type: Number}
  }],
  outputs: [{
    satoshi: {type: Number},
    value: {type: String},
    n: {type: Number},
    scriptPubKey: {
      asm: {type: String},
      hex: {type: String},
      type: {type: String},
      addresses: [{type: String}]
    }
  }]

});

Transaction.pre('validate', function(next) {
  this.payload = `${this.blockNumber}:${this.hash}`;
  next();
});

module.exports = mongoose.model('BitcoinTransaction', Transaction);