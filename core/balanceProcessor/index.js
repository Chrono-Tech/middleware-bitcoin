const config = require('../../config'),
  mongoose = require('mongoose'),
  transactionModel = require('../../models/transactionModel'),
  accountModel = require('../../models/accountModel'),
  fetchBalanceByAccService = require('./fetchBalanceByAccService'),
  _ = require('lodash'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.balanceProcessor'}),
  amqp = require('amqplib');

/**
 * @module entry point
 * @description update balances for accounts, which addresses were specified
 * in received transactions from blockParser via amqp
 */

mongoose.connect(config.mongo.uri);

let init = async() => {
  let conn = await amqp.connect(config.rabbit.url);
  let channel = await conn.createChannel();

  try {
    await channel.assertExchange('events', 'topic', {durable: false});
    await channel.assertQueue('app.balance_processor');
    await channel.bindQueue('app.balance_processor', 'events', 'bitcoin_transaction.*');
  } catch (e) {
    log.error(e);
    channel = await conn.createChannel();
  }

  channel.consume('app.balance_processor', async(data) => {
    let txs;
    try {
      txs = JSON.parse(data.content.toString());
    } catch (e) {
      log.error(e);
      return;
    }

    txs = await transactionModel.find({'format.txid': {$in: txs}});

    let addresses = _.chain(txs)
      .map(tx =>
        _.chain(tx.outputs)
          .map(out =>
            out.scriptPubKey.addresses
          )
          .flattenDeep()
          .value()
      )
      .flattenDeep()
      .uniq()
      .value();

    let accounts = await accountModel.find({addresses: {$in: addresses}});

    let balances = await fetchBalanceByAccService(accounts);

    await Promise.all(balances.map(data =>
      accountModel.update({account: data.account.account}, {$set: {balance: data.balance}}).catch(() => {
      })
    ));

    await Promise.all(balances.map(item =>
      item.account.addresses
        .map(address =>
          channel.publish('events', `bitcoin_balance.${address}`, new Buffer(JSON.stringify(data)))
        )
    ));

  }, {noAck: true});

};

module.exports = init();