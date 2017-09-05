const _ = require('lodash'),
  accountModel = require('../../../models/accountModel');

/**
 * @service
 * @description filter txs by registered account's addresses
 * @param txs - an array of txs
 * @returns {Promise.<*>}
 */


module.exports = async block => {

  let addresses = _.chain(block.txs)
    .map(tx => _.union(tx.inputs, tx.outputs))
    .flattenDeep()
    .map(i => (i.getAddress() || '').toString())
    .compact()
    .uniq()
    .chunk(100)
    .value();

  let filteredByChunks = await Promise.all(addresses.map(chunk =>
    accountModel.find({address: {$in: chunk}})
  ));

  return _.chain(filteredByChunks)
    .flattenDeep()
    .map(address => ({
        address: address,
        txs: _.chain(block.txs)
          .filter(tx =>
            _.chain(tx.inputs)
              .union(tx.outputs)
              .flattenDeep()
              .map(i => (i.getAddress() || '').toString())
              .includes(address)
              .value()
          )
          .map(tx => tx.hash('hex'))
          .value()
      })
    )
    .value();

};
