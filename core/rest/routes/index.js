const accountModel = require('../../../models/accountModel'),
  _ = require('lodash'),
  messages = require('../../../factories').messages.genericMessageFactory,
  express = require('express'),
  fetchBalanceService = require('../services/fetchBalanceService');

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
      let balances = await fetchBalanceService(account.address);
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

    res.send(_.get(account, 'balances', {}));

  });

  app.use('/addr', router);

};
