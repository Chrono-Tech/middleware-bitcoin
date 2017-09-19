const bcoin = require('bcoin'),
  filterAccountsService = require('./services/filterAccountsService'),
  ipcService = require('./services/ipcService'),
  eventsEmitterService = require('./services/eventsEmitterService'),
  mongoose = require('mongoose'),
  amqp = require('amqplib'),
  memwatch = require('memwatch-next'),
  bunyan = require('bunyan'),
  customNetworkRegistrator = require('./networks'),
  log = bunyan.createLogger({name: 'core.blockProcessor'}),
  networks = require('bcoin/lib/protocol/networks'),
  config = require('../../config');

/**
 * @module entry point
 * @description process blocks, and notify, through rabbitmq, other
 * services about new block or tx, where we meet registered address
 */

customNetworkRegistrator(networks);

const node = new bcoin.fullnode({
  network: config.bitcoin.network,
  db: config.bitcoin.db,
  prefix: config.bitcoin.dbpath,
  spv: true,
  indexTX: true,
  indexAddress: true,
  'log-level': 'debug',
  'coinbase-address': config.bitcoin.coinbase
});

mongoose.Promise = Promise;
mongoose.connect(config.mongo.uri, {useMongoClient: true});

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
    eventsEmitterService(amqpInstance, `${config.rabbit.serviceName}_block`, {block: entry.height});
    let filtered = await filterAccountsService(block);

    await Promise.all(filtered.map(item =>
      eventsEmitterService(amqpInstance, `${config.rabbit.serviceName}_transaction.${item.address}`, item)
    ));

  });

  ipcService(node);
  node.startSync();
};

module.exports = init();
