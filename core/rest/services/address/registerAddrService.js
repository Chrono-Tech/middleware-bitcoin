const accountModel = require('../../../../models/accountModel'),
  messages = require('../../../../factories').messages.genericMessageFactory,
  _ = require('lodash'),
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

  try {
    let utxos = await fetchUTXOService(req.body.address);
    let balances = calcBalanceService(utxos);

    account.balances = _.merge({
      confirmations0: 0,
      confirmations3: 0,
      confirmations6: 0
    }, balances.balances);
    account.lastBlockCheck = balances.lastBlockCheck;
    await account.save();

    res.send(messages.success);
  }catch (e){
    console.log(e)
    res.send(messages.fail);
  }
};
