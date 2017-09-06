const _ = require('lodash'),
  Network = require('bcoin/lib/protocol/network'),
  TX = require('bcoin/lib/primitives/tx'),
  config = require('../../../config');

/**
 * @service
 * @description get balances for each account
 * @param txHex - raw transaction
 * @returns {Promise.<[{balance, account}]>}
 */

module.exports = tx => {

  let outputs = _.chain(tx.outputs)
    .map((output, i) => ({
      from: tx.inputs[i].address,
      to: output.address,
      amount: output.value
    }))
    .filter(d => d.from !== d.to)
    .value();

  let addresses = _.chain(outputs)
    .map(output => [output.from, output.to])
    .flattenDeep()
    .uniq()
    .compact()
    .value();

  return _.chain(addresses)
    .map(address => {

      let outComeBalance = _.chain(outputs)
        .filter({from: address})
        .map(i => i.amount)
        .sum()
        .defaults(0)
        .value();

      let inComeBalance = _.chain(outputs)
        .filter({to: address})
        .map(i => i.amount)
        .sum()
        .defaults(0)
        .value();

      return {
        address: address,
        balance: inComeBalance - outComeBalance
      };

    })
    .defaults([])
    .value();

};
