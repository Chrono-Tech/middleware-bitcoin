const fetchTxFromBlockService = require('./services/fetchTxFromBlockService'),
  filterTxService = require('./services/filterTxService'),
  eventsEmitterService = require('./services/eventsEmitterService'),
  fetchBalanceByAddsService = require('./services/fetchBalanceByAddsService'),
  config = require('./config'),
  express = require('express'),
  routes = require('./routes'),
  transactionModel = require('./models/transactionModel'),
  accountModel = require('./models/accountModel'),
  blockModel = require('./models/blockModel'),
  amqpCtrl = require('./controllers/amqpCtrl'),
  cors = require('cors'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  bodyParser = require('body-parser'),
  memwatch = require('memwatch-next'),
  mongoose = require('mongoose'),
  bitcoin = Promise.promisifyAll(require('bitcoin'));

mongoose.connect(config.mongo.uri);
let app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

routes(app);

app.listen(config.rest.port || 8081);

Promise.all([
  blockModel.findOne(),
  amqpCtrl()
]).spread((currentBlock, amqpInstance) => {

  currentBlock = _.chain(currentBlock).get('block', 0).add(0).value();

  let is_leak = false;
  memwatch.on('leak', (info) => {
    is_leak = true;
    console.error('Memory leak detected:\n', info);
  });

  // let currentBlock = 39530; //39530 68230 205530 206330
  let process = async(block, amount) => {

    try {

      if (is_leak) {
        console.log('leak detected on block: ', block);
        is_leak = false;
        return setTimeout(() => process(block, amount), 30000);
      }

      let data = await Promise.resolve(fetchTxFromBlockService(block, amount)).timeout(60000);
      let filtered = await filterTxService(data.txs);
      let accountBalances = await fetchBalanceByAddsService(filtered.affectedAccounts);

      await Promise.all(filtered.txs.map(tx =>
        new transactionModel(tx).save().catch(() => {
        })
      ));

      await Promise.all(accountBalances.map(data =>
        accountModel.update({account: data.account}, {$set: {balance: data.balance}}).catch((e) => {
        })
      ));

      await Promise.all(filtered.txs.map(tx =>
        eventsEmitterService(amqpInstance, 'bitcoin_transaction', tx).catch(() => {
        })
      ));

      await Promise.all(accountBalances.map(tx =>
        eventsEmitterService(amqpInstance, 'bitcoin_balance', tx).catch(() => {
        })
      ));

      console.log('block:', block, 'processed with next amount of', amount);

      await blockModel.findOneAndUpdate({}, {
        $set: {
          block: data.upBlock,
          created: Date.now()
        }
      }, {upsert: true});
      return await process(data.upBlock, 100);
    } catch (e) {
      if (e instanceof Promise.TimeoutError && amount !== 1) {
        console.log('block:', block, 'timeout with amount', amount);
        return setTimeout(() => process(block, parseInt(amount / 2)), 10000);
      }

      if (e.code === 1 && e.maxBlock - block !== 0) {
        console.log('max block reached');
        return setTimeout(() => process(block, e.maxBlock - block), 1000);
      }

      if (e.code === 1 && e.maxBlock - block === 0) {
        console.log('heads are equal');
        return setTimeout(() => process(block, 1), 60000 * 5);
      }

      process(++block, 100);

    }

  };

  process(currentBlock, 100);

});


