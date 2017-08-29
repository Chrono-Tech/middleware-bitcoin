const _ = require('lodash'),
  accountModel = require('../../../models/accountModel');

/**
 * @service
 * @description filter txs by registered account's addresses
 * @param txs - an array of txs
 * @returns {Promise.<*>}
 */


module.exports = async txs => {

  let addresses = _.chain(txs)
    .map(tx =>
      _.chain(tx.details)
        .map(item => item.address)
        .flattenDeep()
        .value()
    )
    .flattenDeep()
    .uniq()
    .value();

  let accounts = await accountModel.find({addresses: {$in: addresses}});

  return _.map(accounts, account =>
    _.set(account.toObject(), 'txs', _.filter(txs, tx =>
      _.find(tx.details, detail =>
        account.addresses.includes(detail.address))
    )
    )
  );

};
