const _ = require('lodash'),
  accountModel = require('../../../models/accountModel'),
  transactionModel = require('../../../models/transactionModel'),
  q2mb = require('query-to-mongo-and-back'),
  config = require('../../../config'),
  messages = require('../../../factories').messages.genericMessageFactory,
  express = require('express'),
  Promise = require('bluebird'),
  bitcoin = Promise.promisifyAll(require('bitcoin'));

module.exports = (app) => {

  let router = express.Router();
  let client = new bitcoin.Client(Object.assign({timeout: 60000 * 10}, config.bitcoin));

  app.get('/', (req, res) => {
    res.send({
      status: 1
    });
  });

  router.post('/addr', async (req, res) => {

    if (!req.body.address) {
      return res.send(messages.fail);
    }

    let account = new accountModel(req.body);

    if (account.validateSync()) {
      return res.send(messages.fail);
    }

    await client.importAddressAsync(account.address, account.address, false);
    let txs = await client.listReceivedByAddressAsync(0, false);

    txs = await Promise.mapSeries(
      _.chain(txs)
        .filter({address: account.address})
        .map(tx => tx.txids)
        .flattenDeep()
        .map(tx => ({
          method: 'gettransaction',
          params: [tx]
        }))
        .compact()
        .chunk(100)
        .value(), txs =>
        new Promise(res => {
          let answers = [];
          client.cmd(txs, function (err, tx) {
            err ? answers.push(null) :
              answers.push(tx);

            if (answers.length === txs.length) {
              res(_.compact(answers));
            }
          });
        })
    );

    await Promise.all(
      _.chain(txs)
        .flattenDeep()
        .map(tx => {
          tx.payload = `${tx.blockhash}:${tx.txid}`;
          return new transactionModel(tx).save().catch((e) => {
            console.log(e);
          });
        })
        .value()
    );

    try {
      await account.save();
    } catch (e) {
      return res.send(messages.fail);
    }
    res.send(messages.success);

  });

  router.delete('/account', async (req, res) => {

    if (!req.body.address) {
      return res.send(messages.fail);
    }

    try {
      await accountModel.remove({account: req.body.account});
    } catch (e) {
      return res.send(messages.fail);
    }
    res.send(messages.success);

  });

  router.get('/', async (req, res) => {
    //convert query request to mongo's
    let q = q2mb.fromQuery(req.query);
    //retrieve all records, which satisfy the query
    let result = await transactionModel.find(q.criteria, q.options.fields)
      .sort(q.options.sort)
      .limit(q.options.limit || 10)
      .catch(() => []);

    res.send(result);

  });

  app.use('/transactions', router);

};
