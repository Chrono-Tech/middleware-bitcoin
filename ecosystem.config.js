const fs = require('fs'),
  apps = [
    {
      name: 'block_processor',
      script: 'core/middleware-bitcoin-blockprocessor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        RABBIT_URI: 'amqp://localhost:5672',
        BITCOIN_NETWORK: 'regtest',
        BITCOIN_DB: 'memory',
        BITCOIN_IPC: 'bitcoin',
        BITCOIN_IPC_PATH: '/tmp/',
        BITCOIN_ETHERBASE: 'RXjwE6pvdFoR9m81KZKZVotZpn4j1SLrvH'
      }
    },
    {
      name: 'balance_processor',
      script: 'core/middleware-bitcoin-balance-processor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        RABBIT_URI: 'amqp://localhost:5672',
        BITCOIN_IPC: 'bitcoin',
        BITCOIN_IPC_PATH: '/tmp/',
      }
    },
    {
      name: 'rest',
      script: 'core/middleware-bitcoin-rest',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        REST_PORT: 8081,
        BITCOIN_IPC: 'bitcoin',
        BITCOIN_IPC_PATH: '/tmp/'
      }
    }
  ];

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: apps.filter(app => fs.existsSync(app.script))
};