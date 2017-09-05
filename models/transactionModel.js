const mongoose = require('mongoose');

/** @model transactionModel
 *  @description block model - represents a block in eth
 */
const Transaction = new mongoose.Schema({
  payload: {type: String, unique: true},
  hash: {type: String},
  witnessHash: {type: String},
  size: {type: Number},
  virtualSize: {type: Number},
  value: {type: String},
  fee: {type: String},
  rate: {type: String},
  minFee: {type: String},
  inputs: [{
    type: {type: String},
    subtype: {type: String},
    address: {type: String},
    redeem: {type: String},
    sequence: {type: Number},
    coin: {type: String}
  }
  ],
  outputs: [{
    type: {type: String},
    value: {type: String},
    address: {type: String}
  }],
  locktime: {type: Number}
});

module.exports = mongoose.model('BitcoinTransaction', Transaction);
