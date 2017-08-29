const bcoin = require('bcoin'),
  mongoose = require('mongoose'),
  config = require('../config'),
  _ = require('lodash'),
  transactionModel = require('../models/transactionModel'),
  accountModel = require('../models/accountModel');

const node = new bcoin.fullnode({
  network: 'testnet',
  db: 'leveldb',
  prefix: './db',
  indexTX: true,
  indexAddress: true
});

mongoose.connect(config.mongo.uri);

(async function () {
  await node.open();
  await node.connect();

  node.on('connect', function (entry, block) {
    console.log('%s (%d) added to chain.', entry.rhash(), entry.height);
  });

  /*  node.on('tx', function (tx) {
   console.log('%s added to mempool.', tx.txid);
   });*/

  node.on('block', async function (block) {

    try {
      let addresses = _.chain(block.txs)
        .map(tx => _.union(tx.inputs, tx.outputs))
        .flattenDeep()
        .map(i => (i.getAddress() || '').toString())
        .compact()
        .uniq()
        .chunk(100)
        .value();

      console.log(addresses.length);

      /*      let filteredByChunks = await Promise.all(addresses.map(chunk =>
       accountModel.find({address: {$in: chunk}})
       ));*/

      let filteredByChunks = _.take(addresses, 10);

      let filtered = _.chain(filteredByChunks)
        .flattenDeep()
        .map(address =>
          _.chain(block.txs)
            .filter(tx =>
              _.chain(tx.inputs)
                .union(tx.outputs)
                .flattenDeep()
                .map(i => (i.getAddress() || '').toString())
                .includes(address)
                .value()
            )
            .map(tx =>
              Object.assign(tx.toJSON(), {payload: `${block.rhash().toString()}:${tx.hash}`})
            )
            .value()
        )
        .flattenDeep()
        .uniqBy('payload')
        .value();

      await Promise.all(filtered.map(tx => {
          return new transactionModel(tx).save();
        })
      );

    } catch (e) {
      console.log(e);
    }
  });

  //152789

  let result = await node.getTXByAddress('mobEo1ujMWMQiQ2fQQ3UzLUxFUh6tLNEVd');
  //let result = await node.hasTX('0a757e213774918e3c17e99e2684a92ceadbb05bb975aecaf69a63fe90159028');
  // console.log(result);

  node.startSync();
})();
