const config = require('../../config'),
  mongoose = require('mongoose'),
  fetchBalanceService = require('./fetchBalanceService'),
  accountModel = require('../../models/accountModel'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.balanceProcessor'}),
  amqp = require('amqplib');

/**
 * @module entry point
 * @description update balances for addresses, which were specified
 * in received transactions from blockParser via amqp
 */

mongoose.connect(config.mongo.uri);

let init = async () => {
  let conn = await amqp.connect(config.rabbit.url);
  let channel = await conn.createChannel();

  try {
    await channel.assertExchange('events', 'topic', {durable: false});
    await channel.assertQueue('app_bitcoin.balance_processor.tx');
    await channel.bindQueue('app_bitcoin.balance_processor.tx', 'events', 'bitcoin_transaction.*');
  } catch (e) {
    log.error(e);
    channel = await conn.createChannel();
  }

  try {
    await channel.assertQueue('app_bitcoin.balance_processor.block');
    await channel.bindQueue('app_bitcoin.balance_processor.block', 'events', 'bitcoin_block');
  } catch (e) {
    log.error(e);
    channel = await conn.createChannel();
  }

  channel.prefetch(2);

  channel.consume('app_bitcoin.balance_processor.block', async data => {
    let payload;
    try {
      payload = JSON.parse(data.content.toString());
    } catch (e) {
      log.error(e);
      channel.ack(data);
      return;
    }

    let accounts = await accountModel.find({
      $where: 'obj.balances && !(obj.balances.confirmations0 === obj.balances.confirmations3 && ' +
      'obj.balances.confirmations3 ===  obj.balances.confirmations6)',
      lastBlockCheck: {$lt: payload.block}
    });

    for (let account of accounts) {
      try {
        let balances = await fetchBalanceService(account.address);
        await accountModel.update({address: account.address}, {$set: balances});
        channel.publish('events', `bitcoin_balance.${account.address}`, new Buffer(JSON.stringify({balances: balances.balances})));
      } catch (e) {
        log.error(e);
      }
    }

    channel.ack(data);
  });

  channel.consume('app_bitcoin.balance_processor.tx', async (data) => {
    let payload;
    try {
      payload = JSON.parse(data.content.toString());
    } catch (e) {
      channel.ack(data);
      log.error(e);
      return;
    }

    try {
      let balances = await fetchBalanceService(payload.address);
      await accountModel.update({
        address: payload.address,
        lastBlockCheck: {$lt: balances.lastBlockCheck}
      }, {$set: balances});
      channel.publish('events', `bitcoin_balance.${payload.address}`, new Buffer(JSON.stringify({balances: balances.balances})));
      log.info(`balance updated with: ${JSON.stringify(balances)} for ${payload.address}`);
    } catch (e) {
      log.error(e);
    }

    channel.ack(data);
  });

};

module.exports = init();
