const _ = require('lodash'),
  path = require('path'),
  accountModel = require('../models/accountModel'),
  q2mb = require('query-to-mongo-and-back'),
  messages = require('../factories').messages.genericMessageFactory,
  express = require('express');

module.exports = (app) => {

  let router = express.Router();

  app.get('/', (req, res) => {
    res.send({
      status: 1
    });
  });

  router.post('/account', async(req, res) => {
    let account = new accountModel(req.body);
    if (account.validateSync())
      return res.send(messages.fail);

    try {
      await account.save();
    } catch (e) {
      return res.send(messages.fail);
    }
    res.send(messages.success);

  });

  router.delete('/transactions/account', async(req, res) => {

    if (!req.body.address)
      return res.send(messages.fail);

    try {
      await accountModel.remove({address: req.body.address});
    } catch (e) {
      return res.send(messages.fail);
    }
    res.send(messages.success);

  });

  router.get('/transactions', async(req, res) => {
    //convert query request to mongo's
    let q = q2mb.fromQuery(req.query);
    //retrieve all records, which satisfy the query
    let result = await transactionModel.find(q.criteria, q.options.fields)
      .sort(q.options.sort)
      .limit(q.options.limit)
      .catch(() => []);

    res.send(result);

  });


  app.use('/transactions', router);


};