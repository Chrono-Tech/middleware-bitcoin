const Promise = require('bluebird'),
  _ = require('lodash'),
  config = require('../../../config'),
  bitcoinlib = require('bitcoinjs-lib'),
  bitcoin = Promise.promisifyAll(require('bitcoin')),
  client = new bitcoin.Client(config.bitcoin);

/**
 * @service
 * @description get range of blocks by number and size, fetch txs from block
 * and decode each of them
 * @param fromBlock
 * @param size
 * @returns {Promise.<{txs, upBlock}>}
 */

module.exports = async (fromBlock, size = 100) => {

  let currentBlock = await client.getBlockCountAsync();

  let toBlockNumber = fromBlock + size;

  if (toBlockNumber > currentBlock) {
    return Promise.reject({code: 1, maxBlock: currentBlock});
  }

  let blockHashes = await new Promise(res => {
    let answers = [];
    let batch = [];
    for (let i = fromBlock; i < toBlockNumber; ++i) {
      batch.push({
        method: 'getblockhash',
        params: [i]
      });
    }

    client.cmd(batch, function (err, blockHash) {

      err ? answers.push(null) :
        answers.push(blockHash);
      if (answers.length === toBlockNumber - fromBlock) {
        res(_.compact(answers));
      }
    });
  });

  let blocks = await new Promise(res => {
    let answers = [];
    client.cmd(
      _.chain(blockHashes)
        .map(hash => ({
          method: 'getblock',
          params: [hash]
        }))
        .compact()
        .value(), function (err, block) {
        block.number = fromBlock + answers.length;
        err ? answers.push(null) :
          answers.push(block);
        if (answers.length === toBlockNumber - fromBlock) {
          res(_.compact(answers));
        }
      });
  });

  console.log(blocks[0].tx)
  for (let i = 0; i < blocks.length; i++) {
    let txs = await Promise.mapSeries(
      _.chain(blocks[i].tx)
        .map(tx => ({
          method: 'gettransaction',
          params: [tx]
        }))
        .compact()
        .chunk(100)
        .value(), txs =>
        new Promise(res => {
          let answers = [];
          client.cmd(txs, function (err, tx) {
            //console.log(err || tx)
            answers.push(tx);
            if (answers.length === txs.length) {
              res(_.compact(answers));
            }
          });
        })
    );

    console.log(txs[0])
    blocks[i].addresses = _.chain(txs)
      .map(tx =>
        _.chain(tx.details)
          .map(item => item.address)
          .flattenDeep()
          .value()
      )
      .flattenDeep()
      .uniq()
      .value();
  }


  return {
    blocks: blocks,
    upBlock: toBlockNumber
  };

};
