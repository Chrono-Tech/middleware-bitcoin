const _ = require('lodash'),
  accountModel = require('../../../models/accountModel'),
  transactionModel = require('../../../models/transactionModel'),
  q2mb = require('query-to-mongo-and-back'),
  messages = require('../../../factories').messages.genericMessageFactory,
  express = require('express'),
  Promise = require('bluebird'),
  bitcoin = Promise.promisifyAll(require('bitcoin'));


module.exports = (app) => {

  let router = express.Router();
  let client = new bitcoin.Client({
    host: 'localhost',
    port: 8332,
    user: 'user',
    pass: 123
  });


  app.get('/', (req, res) => {
    res.send({
      status: 1
    });
  });

  router.post('/account', async(req, res) => {

    if (!req.body.account)
      return res.send(messages.fail);

    let address = await client.getAccountAddressAsync(req.body.account);
    let account = new accountModel(_.merge({addresses: [address]}, req.body));
    if (account.validateSync())
      return res.send(messages.fail);

    try {
      await account.save();
    } catch (e) {
      return res.send(messages.fail);
    }
    res.send(messages.success);

  });

  router.delete('/account', async(req, res) => {

    if (!req.body.address)
      return res.send(messages.fail);

    try {
      await accountModel.remove({account: req.body.account});
    } catch (e) {
      return res.send(messages.fail);
    }
    res.send(messages.success);

  });

  router.get('/', async(req, res) => {
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