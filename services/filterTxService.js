const _ = require('lodash'),
  accountModel = require('../models/accountModel');

module.exports = async txs => {

  let addresses = _.chain(txs)
    .map(tx =>
      _.chain(tx.outputs)
        .map(out =>
          out.scriptPubKey.addresses
        )
        .flattenDeep()
        .value()
    )
    .flattenDeep()
    .uniq()
    .value();

  let accounts = await accountModel.find({addresses: {$in: addresses}});
  addresses = _.chain(accounts)
    .map(account => account.addresses)
    .flattenDeep()
    .value();

  let filteredTxs = _.chain(txs)
    .filter(tx =>
      _.find(tx.outputs, out =>
        _.find(out.scriptPubKey.addresses, address => addresses.includes(address))
      )
    )
    .value();

  let affectedAccounts = _.map(accounts, account=>account.account);


  return {
    txs: filteredTxs,
    affectedAccounts: affectedAccounts
  }

};