const _ = require('lodash'),
  accountModel = require('../../../models/accountModel'),
  Network = require('bcoin/lib/protocol/network');

/**
 * @service
 * @description filter txs by registered addresses
 * @param block - an array of txs
 * @returns {Promise.<*>}
 */


module.exports = async block => {

  let addresses = _.chain(block.txs)
    .map(tx => {
      let network = Network.get('testnet');
      tx = tx.getJSON(network);
      return _.union(tx.inputs, tx.outputs);
    })
    .flattenDeep()
    .map(i => i.address || '')
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
