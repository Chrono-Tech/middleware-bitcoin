const config = require('../../config'),
  mongoose = require('mongoose'),
  transactionModel = require('../../models/transactionModel'),
  accountModel = require('../../models/accountModel'),
  _ = require('lodash'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.balanceProcessor'}),
  ipc = require('node-ipc'),
  amqp = require('amqplib');

/**
 * @module entry point
 * @description update balances for accounts, which addresses were specified
 * in received transactions from blockParser via amqp
 */

Object.assign(ipc.config, {
  id: config.bitcoin.ipcName,
  retry: 1500,
  silent: true
});

mongoose.connect(config.mongo.uri);

let init = async () => {
  let conn = await amqp.connect(config.rabbit.url);
  let channel = await conn.createChannel();
  await new Promise(res => {
    ipc.connectTo(config.bitcoin.ipcName, () => {
      ipc.of[config.bitcoin.ipcName].on('connect', res);

      ipc.of[config.bitcoin.ipcName].on('disconnect', () => {
        process.exit(-1);
      });

    });
  });

  try {
    await channel.assertExchange('events', 'topic', {durable: false});
    await channel.assertQueue('app_bitcoin.balance_processor');
    await channel.bindQueue('app_bitcoin.balance_processor', 'events', 'bitcoin_transaction.*');
  } catch (e) {
    log.error(e);
    channel = await conn.createChannel();
  }

  channel.prefetch(2);
  channel.consume('app_bitcoin.balance_processor', async (data) => {
    let payload;
    try {
      payload = JSON.parse(data.content.toString());
    } catch (e) {
      log.error(e);
      return;
    }

    let coins = await new Promise(res => {
      ipc.of.bitcoin.on('message', res);
      ipc.of.bitcoin.emit('message', JSON.stringify({
          method: 'getcoinsbyaddress',
          params: [payload.address]
        })
      );
    });

    let balance = _.chain(coins)
      .map(coin => coin.value)
      .sum()
      .defaultTo(0)
      .value();

    console.log(`balance updated with: ${balance} for ${payload.address}`);
    await accountModel.update({address: payload.address}, {$set: {balance: balance}});
    channel.publish('events', `bitcoin_balance.${payload.address}`, new Buffer(JSON.stringify({balance: balance})));
    channel.ack(data);
  });

};

module.exports = init();
