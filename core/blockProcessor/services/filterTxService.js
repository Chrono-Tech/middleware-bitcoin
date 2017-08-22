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


  return _.map(accounts, account =>
    _.set(account.toObject(), 'txs', _.filter(txs, tx =>
      _.find(tx.outputs, out =>
        _.find(out.scriptPubKey.addresses, address => account.addresses.includes(address))
      )))
  );

};
