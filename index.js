const fetchTxFromBlockService = require('./services/fetchTxFromBlockService'),
  filterTxService = require('./services/filterTxService'),
  config = require('./config'),
  express = require('express'),
  routes = require('./routes'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose');

mongoose.connect(config.mongo.uri);
let app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

routes(app);

app.listen(config.rest.port || 8081);

let currentBlock = 39530;
let process = async(block) => {

  try {
    let data = await fetchTxFromBlockService(block);
    let txs = await filterTxService(data.txs);
    if (txs.length)
      console.log(txs[0].outputs[1].scriptPubKey);

    return await process(data.upBlock);
  } catch (e) {
    console.log(e);
  }

};

process(currentBlock);