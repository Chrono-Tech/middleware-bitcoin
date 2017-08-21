const Promise = require('bluebird'),
  txDecoder = require('./txDecoderService'),
  _ = require('lodash'),
  bitcoinlib = require('bitcoinjs-lib'),
  bitcoin = Promise.promisifyAll(require('bitcoin'));

let client = new bitcoin.Client({
  host: 'localhost',
  port: 8332,
  user: 'user',
  pass: 123
});

module.exports = async(fromBlock, size = 100) => {

  let currentBlock = await client.getBlockCountAsync();

  let toBlockNumber = fromBlock + size;

  if (toBlockNumber > currentBlock)
    return Promise.reject({code: 1, maxBlock: currentBlock});

  let blockHashes = await new Promise(res => {
    let answers = [];
    let batch = [];
    for (let i = fromBlock; i < toBlockNumber; ++i)
      batch.push({
        method: 'getblockhash',
        params: [i]
      });

    client.cmd(batch, function(err, blockHash) {
      answers.push(blockHash);
      if (answers.length === toBlockNumber - fromBlock)
        res(answers);
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
        .value(), function(err, blockHash) {
        answers.push(blockHash);
        if (answers.length === toBlockNumber - fromBlock)
          res(answers);
      });
  });

  let txs = await Promise.mapSeries(
    _.chain(blocks)
      .map(block => block.tx)
      .flattenDeep()
      .map(tx => ({
        method: 'getrawtransaction',
        params: [tx]
      }))
      .compact()
      .chunk(100)
      .value(), txs =>
      new Promise(res => {
        let answers = [];
        client.cmd(txs, function(err, blockHash) {
          answers.push(blockHash);
          if (answers.length === txs.length)
            res(answers);
        });
      })
  );

  txs = _.chain(txs)
    .flattenDeep()
    .compact()
    .value();

  return {
    txs: _.chain(txs)
      .compact()
      .map(tx => {
        let decoded = new txDecoder(tx, bitcoinlib.networks.testnet);
        decoded.payload = tx;
        return decoded;
      })
      .value(),
    upBlock: toBlockNumber
  }

};