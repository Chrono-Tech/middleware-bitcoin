const mongoose = require('mongoose'),
  messages = require('../factories').messages.accountMessageFactory;

/** @model accountModel
 *  @description account model - represents an bitcoin account
 */
const Account = new mongoose.Schema({
  account: {type: String, required: true},
  addresses: [{
    type: String,
    unique: true,
    required: true,
    validate: [a => /^[a-km-zA-HJ-NP-Z1-9]{25,36}$/.test(a), messages.wrongAddress]
  }],
  balance: {type: Number, default: 0},
  created: {type: Date, required: true, default: Date.now},

});

module.exports = mongoose.model('BitcoinAccount', Account);
