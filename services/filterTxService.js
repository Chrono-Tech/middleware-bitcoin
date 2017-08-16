const _ = require('lodash'),
  accountModel = require('../models/accountModel');

module.exports = async txs => {

  let accounts = await accountModel.find({});
  accounts = _.map(accounts, account=>account.address);

  return _.chain(txs)
    .filter(tx =>
      _.find(tx.outputs, out =>
        _.difference(accounts, out.scriptPubKey.addresses).length !== accounts.length
      )
    )
    .value();

};