const accountModel = require('../../../models/accountModel'),
  _ = require('lodash'),
  messages = require('../../../factories').messages.genericMessageFactory,
  express = require('express'),
  calcBalanceService = require('../services/calcBalanceService'),
  fetchUTXOService = require('../services/fetchUTXOService');

module.exports = (app) => {

  let router = express.Router();

  app.get('/', (req, res) => {
    res.send({
      status: 1
    });
  });

  router.post('/', async (req, res) => {

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

      account.balances = balances.balances;
      account.lastBlockCheck = balances.lastBlockCheck;
      await account.save();
    } catch (e) {
      return res.send(messages.fail);
    }
    res.send(messages.success);

  });

  router.delete('/', async (req, res) => {

    if (!req.body.address) {
      return res.send(messages.fail);
    }

    try {
      await accountModel.remove({address: req.body.address});
    } catch (e) {
      return res.send(messages.fail);
    }
    res.send(messages.success);

  });

  router.get('/:addr/balance', async (req, res) => {

    let account = await accountModel.findOne({address: req.params.addr});

    let balances = {
      confirmations0: {
        satoshis: _.get(account, 'balances.confirmations0', 0),
        amount: _.get(account, 'balances.confirmations0', 0) / 100000000
      },
      confirmations3: {
        satoshis: _.get(account, 'balances.confirmations3', 0),
        amount: _.get(account, 'balances.confirmations3', 0) / 100000000
      },
      confirmations6: {
        satoshis: _.get(account, 'balances.confirmations6', 0),
        amount: _.get(account, 'balances.confirmations6', 0) / 100000000
      },
    };

    res.send(balances);

  });

  router.get('/:addr/utxo', async (req, res) => {
    let utxos = await fetchUTXOService(req.params.addr);
    res.send(utxos);
  });

  app.use('/addr', router);

};
