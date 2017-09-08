const bcoin = require('bcoin'),
  filterAccountsService = require('../core/blockProcessor/services/filterAccountsService'),
  ipcService = require('../core/blockProcessor/services/ipcService'),
  eventsEmitterService = require('../core/blockProcessor/services/eventsEmitterService'),
  mongoose = require('mongoose'),
  amqp = require('amqplib'),
  memwatch = require('memwatch-next'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.blockProcessor'}),
  config = require('../config'),
  shared = require('./shared');

/**
 * @module entry point
 * @description process blocks, and notify, through rabbitmq, other
 * services about new block or tx, where we meet registered address
 */

const node = new bcoin.fullnode({
  network: 'regtest',
  db: 'memory',
  spv: true,
  indexTX: true,
  indexAddress: true,
  'log-level': 'info',
  'coinbase-address': [shared.accountA.getAddress(), shared.accountB.getAddress()]
});

mongoose.connect(config.mongo.uri);

const init = async function () {
  let amqpInstance = await amqp.connect(config.rabbit.url);
  await node.open();
  await node.connect();

  memwatch.on('leak', () => {
    log.info('leak');

    if (!node.pool.syncing) {
      return;
    }

    try {
      node.stopSync();
    } catch (e) {
    }

    setTimeout(() => node.startSync(), 60000);
  });

  node.on('connect', async (entry, block) => {
    log.info('%s (%d) added to chain.', entry.rhash(), entry.height);
    eventsEmitterService(amqpInstance, 'bitcoin_block', {block: entry.height});
    let filtered = await filterAccountsService(block);

    await Promise.all(filtered.map(item =>
      eventsEmitterService(amqpInstance, `bitcoin_transaction.${item.address}`, item)
    ));

  });

  ipcService(node);
  node.startSync();
};

module.exports = init();
