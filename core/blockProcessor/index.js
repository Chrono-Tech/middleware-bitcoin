const bcoin = require('bcoin'),
  filterAccountsService = require('./services/filterAccountsService'),
  ipcService = require('./services/ipcService'),
  eventsEmitterService = require('./services/eventsEmitterService'),
  mongoose = require('mongoose'),
  amqp = require('amqplib'),
  memwatch = require('memwatch-next'),
  config = require('../../config');

const node = new bcoin.fullnode({
  network: config.bitcoin.network,
  db: 'leveldb',
  prefix: config.bitcoin.dbpath,
  spv: true,
  indexTX: true,
  indexAddress: true
});

mongoose.connect(config.mongo.uri);

const init = async function () {
  let amqpInstance = await amqp.connect(config.rabbit.url);
  await node.open();
  await node.connect();

  memwatch.on('leak', () => {
    console.log('leak');

    if (!node.pool.syncing)
      return;

    try{
      node.stopSync();
    }catch (e){
     console.log(node.pool.syncing);
    }

    setTimeout(()=>node.startSync(), 60000);
  });


  node.on('connect', function(entry, block) {
    console.log('%s (%d) added to chain.', entry.rhash(), entry.height);
    eventsEmitterService(amqpInstance, 'bitcoin_block', {block: entry.height});
  });

  node.on('block', async function (block) {

    let filtered = await filterAccountsService(block);

    await Promise.all(filtered.map(item =>
      eventsEmitterService(amqpInstance, `bitcoin_transaction.${item.address}`, item)
    ));

  });

  ipcService(node);
  node.startSync();
};

module.exports = init();
