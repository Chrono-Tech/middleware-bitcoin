require('dotenv').config();

/**
 * @factory config
 * @description base app's configuration
 * @returns {{
 *    mongo: {
 *      uri: (*)
 *      },
 *    rest: {
 *      domain: (*),
 *      port: (*)
 *      },
 *    rabbit: {
 *      url: (*)
 *      },
 *    bitcoin: {
 *      host: (*),
 *      port: (*),
 *      user: (*),
 *      pass: (*)
 *      }
 *    }}
 */

module.exports = {
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/data'
  },
  rest: {
    domain: process.env.DOMAIN || 'localhost',
    port: parseInt(process.env.REST_PORT) || 8081
  },
  rabbit: {
    url: process.env.RABBIT_URI || 'amqp://localhost:5672'
  },
  /*  bitcoin: {
   dbpath: '../test_bcoin/db',
   network: 'testnet',
   db: 'leveldb',
   ipcName: 'bitcoin'
   }*/
  bitcoin: {
    dbpath: '',
    network: 'regtest',
    db: 'memory',
    ipcName: 'bitcoin',
    coinbase: ['RXjwE6pvdFoR9m81KZKZVotZpn4j1SLrvH']
  }
};
