const _ = require('lodash'),
  accountModel = require('../models/accountModel');

module.exports = async txs => {

  let accounts = await accountModel.find({});
  accounts = _.map(accounts, account=>account.address);


  let filteredTxs = _.chain(txs)
    .filter(tx =>
      _.find(tx.outputs, out =>
        _.difference(accounts, out.scriptPubKey.addresses).length !== accounts.length
      )
    )
    .value();

  let affectedAddresses = _.chain(filteredTxs)
    .map(tx=> _.chain(tx.outputs)
      .map(out=> out.scriptPubKey.addresses)
      .flattenDeep()
      .value()
    )
    .flattenDeep()
    .filter(address=> accounts.includes(address))
    .uniq()
    .value();

  return {
    txs: filteredTxs,
    affectedAddresses: affectedAddresses
  }

};