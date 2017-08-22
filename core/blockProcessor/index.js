const fetchTxFromBlockService = require('./services/fetchTxFromBlockService'),
  filterTxService = require('./services/filterTxService'),
  eventsEmitterService = require('./services/eventsEmitterService'),
  config = require('../../config'),
  transactionModel = require('../../models/transactionModel'),
  blockModel = require('../../models/blockModel'),
  _ = require('lodash'),
  memwatch = require('memwatch-next'),
  mongoose = require('mongoose'),
  bunyan = require('bunyan'),
  amqp = require('amqplib'),
  Promise = require('bluebird'),
  log = bunyan.createLogger({name: 'core.blockProcessor'});

/**
 * @module entry point
 * @description parse blocks from bitcoin, save txs, where one of registered accounts
 * has been detected, and notify other services about new txs via amqp
 */


mongoose.connect(config.mongo.uri);

let init = async() => {

  let currentBlock = await blockModel.findOne();
  let amqpInstance = await amqp.connect(config.rabbit.url);

  currentBlock = _.chain(currentBlock).get('block', 0).add(0).value();

  let is_leak = false;
  memwatch.on('leak', (info) => {
    is_leak = true;
    log.error('Memory leak detected:\n', info);
  });

  // let currentBlock = 39530; //39530 68230 205530 206330
  let process = async(block, amount) => {

    try {

      if (is_leak) {
        log.warn('leak detected on block: ', block);
        is_leak = false;
        return setTimeout(() => process(block, amount), 30000);
      }

      let data = await Promise.resolve(fetchTxFromBlockService(block, amount)).timeout(60000);
      let filtered = await filterTxService(data.txs);

      await Promise.all(
        _.chain(filtered)
          .map(account => account.txs)
          .flattenDeep()
          .map(tx =>
            new transactionModel(tx).save().catch(() => {
            })
          ));

      await Promise.all(
        _.chain(filtered)
          .map(account =>
            account.addresses.map(address =>
              eventsEmitterService(amqpInstance, `bitcoin_transaction.${address}`,
                account.txs.map(tx => _.get(tx, 'format.txid'))
              ).catch(() => {
              })
            )
          )
          .flattenDeep()
          .value()
      );

      log.info('block:', block, 'processed with next amount of', amount);

      await blockModel.findOneAndUpdate({}, {
        $set: {
          block: data.upBlock,
          created: Date.now()
        }
      }, {upsert: true});
      return await process(data.upBlock, 100);
    } catch (e) {
      if (e instanceof Promise.TimeoutError && amount !== 1) {
        log.info('block:', block, 'timeout with amount', amount);
        return setTimeout(() => process(block, parseInt(amount / 2)), 10000);
      }

      if (e.code === 1 && e.maxBlock - block !== 0) {
        log.info('max block reached');
        return setTimeout(() => process(block, e.maxBlock - block), 1000);
      }

      if (e.code === 1 && e.maxBlock - block === 0) {
        log.info('heads are equal');
        return setTimeout(() => process(block, 1), 60000 * 5);
      }

      process(++block, 100);

    }

  };

  process(currentBlock, 100);

};

module.exports = init();