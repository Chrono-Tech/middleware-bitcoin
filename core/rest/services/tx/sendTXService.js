const accountModel = require('../../../../models/accountModel'),
  _ = require('lodash'),
  messages = require('../../../../factories').messages.genericMessageFactory,
  decodeTxService = require('../../utils/decodeTxService'),
  calcBalanceService = require('../../utils/calcBalanceService'),
  calcTxBalanceService = require('../../utils/calcTxBalanceService'),
  pushTxService = require('../../utils/pushTxService'),
  fetchUTXOService = require('../../utils/fetchUTXOService');

module.exports = async (req, res) => {

  if (!req.body.tx) {
    return res.send(messages.fail);
  }

  let decodedTx = decodeTxService(req.body.tx);
  let result = await pushTxService(req.body.tx);
  let txBalances = await calcTxBalanceService(decodedTx);
  for (let txBalance of txBalances) {
    let utxos = await fetchUTXOService(txBalance.address);
    let balances = calcBalanceService(utxos);
    console.log(txBalance)
    console.log(balances)
    _.set(balances, 'balances.confirmations0', txBalance.amount + _.get(balances, 'balances.confirmations6', 0));
    await accountModel.update({address: txBalance.address}, {
      $set: _.transform({
        'balances.confirmations0': _.get(balances, 'balances.confirmations0'),
        'balances.confirmations3': _.get(balances, 'balances.confirmations3'),
        'balances.confirmations6': _.get(balances, 'balances.confirmations6')
      }, (result, val, key) => {
        if (val) {
          result[key] = val;
        }
      }, {lastBlockCheck: balances.lastBlockCheck})
    });
  }

  res.send(result);
};
