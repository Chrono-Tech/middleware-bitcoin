const mongoose = require('mongoose');

/** @model transactionModel
 *  @description block model - represents a block in eth
 */
const Transaction = new mongoose.Schema({
  network: {type: mongoose.Schema.Types.Mixed},
  payload: {type: String, unique: true, required: true},
  amount: {type: Number},
  confirmations: {type: Number},
  generated: {type: Boolean},
  blockhash: {type: String},
  blockindex: {type: Number},
  blocktime: {type: Number},
  txid: {type: String},
  time: {type: Number},
  timereceived: {type: Number},
  'bip125-replaceable': {type: String},
  details: [
    {
      account: {type: String},
      address: {type: String},
      category: {type: String},
      amount: {type: Number},
      vout: {type: Number}
    }
  ],
  hex: {type: String}

});

module.exports = mongoose.model('BitcoinTransaction', Transaction);
