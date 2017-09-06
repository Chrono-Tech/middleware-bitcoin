const accountModel = require('../../../models/accountModel'),
  _ = require('lodash'),
  messages = require('../../../factories').messages.genericMessageFactory,
  express = require('express'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.rest'}),
  decodeTxService = require('../services/decodeTxService'),
  calcBalanceService = require('../services/calcBalanceService'),
  calcTxBalanceService = require('../services/calcTxBalanceService'),
  fetchUTXOService = require('../services/fetchUTXOService');

module.exports = (app) => {

  let routerAddr = express.Router();
  let routerTx = express.Router();

  app.get('/', (req, res) => {
    res.send({
      status: 1
    });
  });

  routerAddr.post('/', async (req, res) => {

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
      log.error(e);
      return res.send(messages.fail);
    }
    res.send(messages.success);

  });

  routerAddr.delete('/', async (req, res) => {

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

  routerAddr.get('/:addr/balance', async (req, res) => {

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

  routerAddr.get('/:addr/utxo', async (req, res) => {
    let utxos = await fetchUTXOService(req.params.addr);
    res.send(utxos);
  });

  routerTx.post('/send', async (req, res) => {

    if (!req.body.tx)
      return res.send(messages.fail);

    try {
      let decodedTx = decodeTxService(req.body.tx);
      let txBalances = calcTxBalanceService(decodedTx);

      for (let txBalance of txBalances) {
        let utxos = await fetchUTXOService(txBalance.address);
        let balances = calcBalanceService(utxos);
        _.set(balances, 'balances.confirmations0', txBalance.balance + _.get(balances, 'balances.confirmations6', 0));
        await accountModel.update({address: txBalance.address}, {
          $set: balances
        });
      }

      console.log(txBalances);

    } catch (e) {
      return res.send(messages.fail);
    }

    res.send(messages.success);
  });

  app.use('/addr', routerAddr);
  app.use('/tx', routerTx);

};
