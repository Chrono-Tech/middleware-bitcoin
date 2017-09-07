const accountModel = require('../../../../models/accountModel'),
  messages = require('../../../../factories').messages.genericMessageFactory,
  calcBalanceService = require('../../utils/calcBalanceService'),
  fetchUTXOService = require('../../utils/fetchUTXOService');

module.exports = async (req, res) => {

  if (!req.body.address) {
    return res.send(messages.fail);
  }

  let account = new accountModel(req.body);

  if (account.validateSync()) {
    return res.send(messages.fail);
  }

  let utxos = await fetchUTXOService(req.body.address);
  let balances = calcBalanceService(utxos);

  account.balances = balances.balances;
  account.lastBlockCheck = balances.lastBlockCheck;
  await account.save();

  res.send(messages.success);

};
