const bcoin = require('bcoin'),
  filterAccountsService = require('./services/filterAccountsService'),
  ipcService = require('./services/ipcService'),
  eventsEmitterService = require('./services/eventsEmitterService'),
  mongoose = require('mongoose'),
  amqp = require('amqplib'),
  memwatch = require('memwatch-next'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.blockProcessor'}),
  config = require('../../config');

/**
 * @module entry point
 * @description process blocks, and notify, through rabbitmq, other
 * services about new block or tx, where we meet registered address
 */


const node = new bcoin.fullnode({
  network: config.bitcoin.network,
  db: 'leveldb',
  prefix: config.bitcoin.dbpath,
  spv: true,
  indexTX: true,
  indexAddress: true,
  'log-level': 'info'
});

mongoose.connect(config.mongo.uri);

const init = async function () {
  let amqpInstance = await amqp.connect(config.rabbit.url);
  await node.open();
  await node.connect();

  memwatch.on('leak', () => {
    log.info('leak');

    if (!node.pool.syncing)
    {return;}

    try {
      node.stopSync();
    } catch (e) {
    }

    setTimeout(() => node.startSync(), 60000);
  });

  node.on('connect', entry => {
    log.info('%s (%d) added to chain.', entry.rhash(), entry.height);
    eventsEmitterService(amqpInstance, 'bitcoin_block', {block: entry.height});
  });

  node.on('block', async block => {

    let filtered = await filterAccountsService(block);

    await Promise.all(filtered.map(item =>
      eventsEmitterService(amqpInstance, `bitcoin_transaction.${item.address}`, item)
    ));

  });

  ipcService(node);
  node.startSync();
};

module.exports = init();
