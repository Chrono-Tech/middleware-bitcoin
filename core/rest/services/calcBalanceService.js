const _ = require('lodash');

/**
 * @service
 * @description get balances for each account
 * @param accounts - fetched accounts from mongodb
 * @returns {Promise.<[{balance, account}]>}
 */

module.exports = utxos => {

  let highestCoin = _.chain(utxos)
    .sortBy('height')
    .last()
    .value();

  let sum = _.chain(utxos)
    .map(coin => coin.satoshis)
    .sum()
    .defaultTo(0)
    .value();

  let balances = {
    confirmations0: 0,
    confirmations3: 0,
    confirmations6: 0
  };

  if (highestCoin.confirmations >= 6)
    _.merge(balances, {confirmations0: sum, confirmations3: sum, confirmations6: sum});

  if (3 <= highestCoin.confirmations < 6)
    _.merge(balances, {confirmations0: sum, confirmations3: sum});

  if (highestCoin.confirmations < 3)
    _.merge(balances, {confirmations0: sum});

  return {
    balances: balances,
    lastBlockCheck: highestCoin.confirmations + highestCoin.height
  };
};
