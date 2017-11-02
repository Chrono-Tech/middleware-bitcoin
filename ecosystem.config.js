const fs = require('fs'),
  apps = [
    {
      name: 'block_processor',
      script: 'core/middleware-bitcoin-blockprocessor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        MONGO_COLLECTION_PREFIX: 'bitcoin',
        RABBIT_URI: 'amqp://localhost:5672',
        NETWORK: 'regtest',
        DB_DRIVER: 'memory',
        IPC_NAME: 'bitcoin',
        IPC_PATH: '/tmp/'
      }
    },
    {
      name: 'balance_processor',
      script: 'core/middleware-bitcoin-balance-processor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        MONGO_COLLECTION_PREFIX: 'bitcoin',
        RABBIT_URI: 'amqp://localhost:5672',
        IPC_NAME: 'bitcoin',
        IPC_PATH: '/tmp/',
      }
    },
    {
      name: 'rest',
      script: 'core/middleware-bitcoin-rest',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        MONGO_COLLECTION_PREFIX: 'bitcoin',
        REST_PORT: 8081,
        IPC_NAME: 'bitcoin',
        IPC_PATH: '/tmp/'
      }
    },
    {
      name: 'block_processor',
      script: 'core/middleware-litecoin-blockprocessor',
      env: {
        MONGO_URI: 'mongodb://localhost:27017/data',
        MONGO_COLLECTION_PREFIX: 'litecoin',
        RABBIT_URI: 'amqp://localhost:5672',
        NETWORK: 'regtest',
        DB_DRIVER: 'memory',
        IPC_NAME: 'litecoin',
        IPC_PATH: '/tmp/'
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